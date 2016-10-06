import request from 'superagent'
import Pbf from 'Pbf'
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

    this.loadData(coords, (err, data) => {
      if (err) return console.error(err)

      for (let y = nw.y - DOT_SIZE; y < se.y + DOT_SIZE; y += DOT_DENSITY) {
        for (let x = nw.x - DOT_SIZE; x < se.x + DOT_SIZE; x += DOT_DENSITY) {
          let latlng = map.unproject([x, y], coords.z)
          let value = data.get([latlng.lat, latlng.lng])

          let colorValues = colorScale.getColor(value)
          if (colorValues !== null) {
            let [r, g, b] = colorValues
            let color = `rgba(${r}, ${g}, ${b}, 0.02)`

            if (!colorMap[color]) {
              colorMap[color] = []
            }

            colorMap[color].push([x - nw.x, y - nw.y])
          }
        }
      }

      Object.keys(colorMap).forEach((color) => {
        let points = colorMap[color]
        ctx.fillStyle = color
        points.forEach((point) => {
          ctx.beginPath()
          ctx.arc(point[0] + Math.random() * 3, point[1] + Math.random() * 3, DOT_SIZE, 0, Math.PI * 2)
          ctx.closePath()
          ctx.fill()
        })
      })

      done(null, tile)
    })

    return tile
  },

  /**
   * Loads data for a given tile.
   */
  loadData (tile, cb) {
    const map = this._map
    const size = this.getTileSize()
    const nwPx = tile.scaleBy(size).subtract([DOT_SIZE * 2, DOT_SIZE * 2])
    const sePx = nwPx.add(size).add([DOT_SIZE * 4, DOT_SIZE * 4])
    const nw = map.unproject(nwPx, tile.z)
    const se = map.unproject(sePx, tile.z)
    const bounds = [
      Math.ceil(nw.lat) + 2,
      Math.floor(nw.lng) - 2,
      Math.floor(se.lat) - 2,
      Math.ceil(se.lng) + 2
    ]
    const time = this.getCurrentDate().getTime()

    request
    .get(`${this.options.baseUrl}/layer/${this.options.type}/${time}`)
    .query({bb: bounds.join(',')})
    .responseType('arraybuffer')
    .end((err, res) => {
      if (err) return cb(err)
      let points = geobuf.decode(res.body)
      let field

      if (this.options.type === 'uvgrd') {
        field = VectorField.fromFeatures(bounds, 1, 1, points.features)
      } else {
        field = ValueField.fromFeatures(bounds, 1, 1, points.features)
      }

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
