export default class ValueField {
  constructor (bounds, dlng, dlat, features) {
    this.dlng = dlng
    this.dlat = dlat
    this.tlng = this.__unwrapLng(bounds[0])
    this.tlat = this.__unwrapLat(bounds[1])
    this.nx = this.__x(this.__unwrapLng(bounds[2])) + 1
    this.ny = this.__y(this.__unwrapLat(bounds[3])) + 1
    // console.log(`${bounds[0]}:${bounds[1]}-${bounds[2]}:${bounds[3]} => ${this.tlng}:${this.tlat} + ${this.nx}:${this.ny}`)

    this.data = new Array(features.length)

    features.forEach((f) => {
      let lnglat = f.geometry.coordinates
      let value = f.properties.value
      let lng = this.__unwrapLng(lnglat[0])
      let lat = this.__unwrapLat(lnglat[1])
      let x = this.__x(lng)
      let y = this.__y(lat)
      let i = this.__i(x, y)

      this.data[i] = value
    })
  }

  __unwrapLng (lng) {
    return (lng % 360 + 180) % 360
  }

  __unwrapLat (lat) {
    return 90 - lat
  }

  __x (lng) {
    let x = lng - this.tlng
    // If bounds cross the date line we need to componsate by adding 360deg
    return (x < 0 ? x + 360 : x) / this.dlng
  }

  __y (lat) {
    return (lat - this.tlat) / this.dlat
  }

  __i (x, y) {
    return y * this.nx + x
  }

  __get (x, y) {
    return this.data[this.__i(x, y)]
  }

  get ([lat, lng]) {
    let xf = this.__x(this.__unwrapLng(lng))
    let yf = this.__y(this.__unwrapLat(lat))
    let x = Math.floor(xf)
    let y = Math.floor(yf)

    let g00 = this.__get(x, y)
    let g10 = this.__get(x + 1, y)
    let g01 = this.__get(x, y + 1)
    let g11 = this.__get(x + 1, y + 1)

    if (!g00 || !g10 || !g01 || !g11) {
      return null
    }

    return this.interpolate(xf - x, yf - y, g00, g10, g01, g11)
  }

  interpolate (x, y, g00, g10, g01, g11) {
    return [this.__interpolate(x, y, g00[0], g10[0], g01[0], g11[0])]
  }

  __interpolate (x, y, g00, g10, g01, g11) {
    const rx = (1 - x)
    const ry = (1 - y)

    const a = rx * ry
    const b = x * ry
    const c = rx * y
    const d = x * y

    return g00 * a + g10 * b + g01 * c + g11 * d
  }
}

// ValueField.fromFeatures = function (bounds, dlat, dlng, features, factoryFn) {
//   const field = []
//
//   features.forEach((feature) => {
//     let lnglat = feature.geometry.coordinates
//     let latlng = [lnglat[1], lnglat[0]]
//     let value = feature.properties.value
//     let y = Math.floor((bounds[0] - latlng[0]) / dlat)
//     let x = Math.floor((latlng[1] - bounds[1]) / dlng)
//
//     if (!field[y]) {
//       field[y] = []
//     }
//
//     field[y][x] = [latlng, value]
//   })
//
//   if (factoryFn) {
//     return factoryFn(bounds, dlat, dlng, field)
//   }
//
//   return new ValueField(bounds, dlat, dlng, field)
// }
