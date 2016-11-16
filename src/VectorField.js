import ValueField from './ValueField'

export default class VectorField extends ValueField {
  interpolate (x, y, g00, g10, g01, g11) {
    return [
      this.__interpolate(x, y, g00[0], g10[0], g01[0], g11[0]),
      this.__interpolate(x, y, g00[1], g10[1], g01[1], g11[1])
    ]
  }
}

// VectorField.fromFeatures = function (bounds, dx, dy, features) {
//   return ValueField.fromFeatures(bounds, dx, dy, features, (bounds, dx, dy, field) => {
//     return new VectorField(bounds, dx, dy, field)
//   })
// }
