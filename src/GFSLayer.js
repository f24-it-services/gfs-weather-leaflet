import request from 'superagent'
import Pbf from 'pbf'
import geobuf from 'geobuf'
request.parse['application/x-protobuf'] = (buffer) => new Pbf(buffer)
import L from 'leaflet'

import VectorField from './VectorField'
import ValueField from './ValueField'

const DOT_SIZE = 20
const DOT_DENSITY = 5

/**
 * A canvas tile layer which renders data from a gfs-weather-server instance.
 * Required options are:
 *  - **baseUrl** the base api url of the weather server
 *  - **type** the name of the layer to query
 *  - **surface** the surface name as given in the gfs inventory
 *  - **date** the initial (starting) date.
 *   **forecast** the initial forecast offset in hours
 * @type {L.GridLayer}
 */
export default L.GridLayer.extend({
  initialize (options) {
    L.setOptions(this, options)
  },

  /**
   * Creates a canvas tile and waits for the data from the weather server before
   * rendering to the canvas.
   */
  createTile (coords, done) {
    // const key = this._tileCoordsToKey(coords)
    // console.time(`${key} total`)
    const tile = L.DomUtil.create('canvas', 'leaflet-tile')
    const {colorScale} = this.options
    const ctx = tile.getContext('2d')
    const size = this.getTileSize()
    const map = this._map

    tile.width = size.x
    tile.height = size.y

    const nw = coords.scaleBy(size)
    const se = nw.add(size)
    const colorMap = {}

    // console.time(`${key} load`)
    this.loadData(coords, (err, data) => {
      if (err) return console.error(err)
      // console.timeEnd(`${key} load`)

      // console.time(`${key} render total`)
      // console.time(`${key} colormap`)
      for (let y = nw.y - DOT_SIZE; y < se.y + DOT_SIZE; y += DOT_DENSITY) {
        for (let x = nw.x - DOT_SIZE; x < se.x + DOT_SIZE; x += DOT_DENSITY) {
          let latlng = map.unproject([x, y], coords.z)
          let value = data.get([latlng.lat, latlng.lng])

          let colorValues = colorScale.getColor(value)
          if (colorValues !== null) {
            let [r, g, b] = colorValues
            let color = `rgba(${r}, ${g}, ${b}, 0.02)`
            let point = [x - nw.x, y - nw.y]

            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(
              point[0] + Math.random() * 3,
              point[1] + Math.random() * 3,
              DOT_SIZE,
              0,
              Math.PI * 2
            )
            ctx.closePath()
            ctx.fill()

            // if (!colorMap[color]) {
            //   colorMap[color] = []
            // }
            //
            // colorMap[color].push([x - nw.x, y - nw.y])
          }
        }
      }
      // console.timeEnd(`${key} colormap`)

      // console.time(`${key} render`)
      // Object.keys(colorMap).forEach((color) => {
      //   let points = colorMap[color]
      //   ctx.fillStyle = color
      //   points.forEach((point) => {
      //     ctx.beginPath()
      //     ctx.arc(point[0] + Math.random() * 3, point[1] + Math.random() * 3, DOT_SIZE, 0, Math.PI * 2)
      //     ctx.closePath()
      //     ctx.fill()
      //   })
      // })
      // console.timeEnd(`${key} render`)
      // console.timeEnd(`${key} render total`)

      // ctx.fillStyle = `rgba(${Math.round(Math.random()*255)}, ${Math.round(Math.random()*255)}, ${Math.round(Math.random()*255)}, 1)`
      // data.forEach(([lat, lng]) => {
      //   let point = map.project([lat, lng], coords.z)
      //   ctx.beginPath()
      //   ctx.arc(point.x - nw.x, point.y - nw.y, 5, 0, Math.PI * 2)
      //   ctx.closePath()
      //   ctx.fill()
      // })

      done(null, tile)
      // console.timeEnd(`${key} total`)
    })

    return tile
  },

  /**
   * Loads data for a given tile.
   */
  loadData (tile, cb) {
    const key = this._tileCoordsToKey(tile)
    // console.log(`tile ${tile.x}:${tile.y}@${tile.z}`)

    let map = this._map
    let size = this.getTileSize()
    let nwPx = tile.scaleBy(size)
    let sePx = nwPx.add(size)

    // console.log(`px bounds ${nwPx.x}:${nwPx.y} - ${sePx.x}:${sePx.y}`)

    nwPx = nwPx.subtract([DOT_SIZE, DOT_SIZE])
    sePx = sePx.add([DOT_SIZE, DOT_SIZE])

    // console.log(`px bounds ${nwPx.x}:${nwPx.y} - ${sePx.x}:${sePx.y}`)
    // nwPx.subtract([DOT_SIZE * 2, DOT_SIZE * 2])
    // sePx.add([DOT_SIZE * 4, DOT_SIZE * 4])

    let nw = map.unproject(nwPx, tile.z)
    let se = map.unproject(sePx, tile.z)

    // console.log(`geo bounds ${nw.lng}:${nw.lat} - ${se.lng}:${se.lat}`)

    let resolution = Math.max(1, (6 - tile.z) * 2)
    let nwLat = nw.lat + resolution - nw.lat % resolution
    let nwLng = nw.lng - resolution - nw.lng % resolution
    let seLat = se.lat - resolution - se.lat % resolution
    let seLng = se.lng + resolution - se.lng % resolution

    if (Math.abs(seLng - nwLng) >= 360) {
      nwLng = -180
      seLng = 180 - resolution
    }

    let bounds = [nwLng, Math.min(90, nwLat), seLng, Math.max(-90, seLat)]

    // console.log('bounds', bounds)
    let time = this.getCurrentDate().getTime()
    // console.time(`${key} io`)
    request
    .get(`${this.options.baseUrl}/layer/${this.options.type}/${time}`)
    .query({bb: bounds.join(','), sf: resolution})
    .responseType('arraybuffer')
    .end((err, res) => {
      if (err) return cb(err)
      // console.timeEnd(`${key} io`)
      // console.time(`${key} parse`)
      let points = geobuf.decode(res.body)
      let grid = points.features.shift()
      let {dx, dy, bounds} = grid.properties
      let field
      // console.timeEnd(`${key} parse`)

      // console.log(`${nw.lng}:${nw.lat} - ${se.lng}:${se.lat}`)

      // console.time(`${key} parse=>prepare`)
      if (this.options.type === 'uvgrd') {
        field = new VectorField(bounds, dx, dy, points.features)
      } else {
        field = new ValueField(bounds, dx, dy, points.features)
      }
      // console.timeEnd(`${key} parse=>prepare`)

      // console.log(field)

      cb(null, field)
    })
  },

  /**
   * Returns the currently displayed date (base date + forecast offset).
   */
  getCurrentDate () {
    return new Date(this.options.date.getTime() + this.options.forecast * 3600000)
  },

  /**
   * Changes the forecast offset, will cause a redraw of all tiles.
   */
  setForecast (hour) {
    this.options.forecast = hour
    if (this._map) this.redraw()
  }
})
