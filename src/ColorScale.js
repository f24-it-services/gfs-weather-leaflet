/**
 * Uses sine-curves to translate numeric values to colors.
 */
export default class ColorScale {
  /**
   * Create a new color scale.
   * The instance will return null for values below minValue. fromRange gives
   * lower and upper bounds for the value. The value is proportionally
   * interpolated to the range given with toRange bevor the color value is
   * calculated.
   *
   * @param {number} minValue
   * @param {number[]} fromRange
   * @param {number[]} toRange
   * @param {number[]} colorShift = [0, 2, 4]
   */
  constructor (minValue, fromRange, toRange, colorShift = [0, 2, 4]) {
    this.minValue = minValue
    this.fromRange = fromRange
    this.toRange = toRange
    this.colorShift = colorShift
  }

  /**
   * Convert to a numeric value. If val is a vector, calculates the magnitude.
   */
  __val (val) {
    if (val === null || val === undefined) {
      return 0
    }

    if (val.length === 2) {
      return Math.sqrt(val[0] * val[0] + val[1] * val[1])
    } else {
      return val[0]
    }
  }

  /**
   * Calculates the magnitude, i.e. the percental position, of the value within
   * toRange.
   * @param {number[]} val
   * @return {number}
   */
  getMagnitude (val) {
    val = this.__val(val)

    let [frMin, frMax] = this.fromRange
    let [trMin, trMax] = this.toRange

    return this.magnitude(val, frMin, frMax, trMin, trMax)
  }

  /**
   * Calculates a color from a value. Returns null if the value is below the
   * threshold and ignoreThreshold isn't true.
   * @param {number[]} val
   * @param {bool} ignoreThreshold = false
   * @return {number[]} array with r/g/b values.
   */
  getColor (val, ignoreThreshold = false) {
    val = this.__val(val)

    if (val < this.minValue && !ignoreThreshold) {
      return null
    }

    let [frMin, frMax] = this.fromRange
    let [trMin, trMax] = this.toRange
    let [ro, go, bo] = this.colorShift
    let mag = this.scale(val, frMin, frMax, trMin, trMax)

    let r = Math.round(Math.sin(mag + ro) * 127 + 128)
    let g = Math.round(Math.sin(mag + go) * 127 + 128)
    let b = Math.round(Math.sin(mag + bo) * 127 + 128)

    return [r, g, b]
  }

  /**
   * Clamps a value to the given bounds.
   * @param {number} v the value
   * @param {number} min lower bounds
   * @param {number} max upper bounds
   * @return {number} the clamped value
   */
  clamp (v, min, max) {
    return Math.max(min, Math.min(max, v))
  }

  /**
   * Calculates the magnitude (i.e. the position within toRange) of a given
   * value.
   * @param {number} v the value
   * @param {number} fmin lower bounds (from)
   * @param {number} fmax upper bounds (from)
   * @param {number} tmin lower bounds (to)
   * @param {number} tmax upper bounds (to)
   * @return {number} the magnitude
   */
  magnitude (v, fmin, fmax, tmin, tmax) {
    return (this.clamp(v, fmin, fmax) - fmin) / (fmax - fmin)
  }

  /**
   * Interpolates a value from one range to another.
   * @param {number} v the value
   * @param {number} fmin lower bounds (from)
   * @param {number} fmax upper bounds (from)
   * @param {number} tmin lower bounds (to)
   * @param {number} tmax upper bounds (to)
   * @return {number} the interpolated value
   */
  scale (v, fmin, fmax, tmin, tmax) {
    return this.magnitude(v, fmin, fmax, tmin, tmax) * (tmax - tmin) + tmin
  }
}

/**
 * Predefined color scale for wind speed.
 * @type {ColorScale}
 */
ColorScale.uvgrd = new ColorScale(5, [0, 17], [4, 9])

/**
 * Predefined color scale for temperature.
 * @type {ColorScale}
 */
ColorScale.tmp = new ColorScale(300, [300, 340], [5, 6], [2, 4, 0])

/**
 * Predefined color scale for precipitation.
 * @type {ColorScale}
 */
ColorScale.prate = new ColorScale(1e-4, [0, 1e-2], [3, 5], [2, 0, 4])
