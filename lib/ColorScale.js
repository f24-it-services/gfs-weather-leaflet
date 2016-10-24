"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Uses sine-curves to translate numeric values to colors.
 */
var ColorScale = function () {
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
  function ColorScale(minValue, fromRange, toRange) {
    var colorShift = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [0, 2, 4];

    _classCallCheck(this, ColorScale);

    this.minValue = minValue;
    this.fromRange = fromRange;
    this.toRange = toRange;
    this.colorShift = colorShift;
  }

  /**
   * Convert to a numeric value. If val is a vector, calculates the magnitude.
   */


  _createClass(ColorScale, [{
    key: "__val",
    value: function __val(val) {
      if (val === null || val === undefined) {
        return 0;
      }

      if (val.length === 2) {
        return Math.sqrt(val[0] * val[0] + val[1] * val[1]);
      } else {
        return val[0];
      }
    }

    /**
     * Calculates the magnitude, i.e. the percental position, of the value within
     * toRange.
     * @param {number[]} val
     * @return {number}
     */

  }, {
    key: "getMagnitude",
    value: function getMagnitude(val) {
      val = this.__val(val);

      var _fromRange = _slicedToArray(this.fromRange, 2);

      var frMin = _fromRange[0];
      var frMax = _fromRange[1];

      var _toRange = _slicedToArray(this.toRange, 2);

      var trMin = _toRange[0];
      var trMax = _toRange[1];


      return this.magnitude(val, frMin, frMax, trMin, trMax);
    }

    /**
     * Calculates a color from a value. Returns null if the value is below the
     * threshold and ignoreThreshold isn't true.
     * @param {number[]} val
     * @param {bool} ignoreThreshold = false
     * @return {number[]} array with r/g/b values.
     */

  }, {
    key: "getColor",
    value: function getColor(val) {
      var ignoreThreshold = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      val = this.__val(val);

      if (val < this.minValue && !ignoreThreshold) {
        return null;
      }

      var _fromRange2 = _slicedToArray(this.fromRange, 2);

      var frMin = _fromRange2[0];
      var frMax = _fromRange2[1];

      var _toRange2 = _slicedToArray(this.toRange, 2);

      var trMin = _toRange2[0];
      var trMax = _toRange2[1];

      var _colorShift = _slicedToArray(this.colorShift, 3);

      var ro = _colorShift[0];
      var go = _colorShift[1];
      var bo = _colorShift[2];

      var mag = this.scale(val, frMin, frMax, trMin, trMax);

      var r = Math.round(Math.sin(mag + ro) * 127 + 128);
      var g = Math.round(Math.sin(mag + go) * 127 + 128);
      var b = Math.round(Math.sin(mag + bo) * 127 + 128);

      return [r, g, b];
    }

    /**
     * Clamps a value to the given bounds.
     * @param {number} v the value
     * @param {number} min lower bounds
     * @param {number} max upper bounds
     * @return {number} the clamped value
     */

  }, {
    key: "clamp",
    value: function clamp(v, min, max) {
      return Math.max(min, Math.min(max, v));
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

  }, {
    key: "magnitude",
    value: function magnitude(v, fmin, fmax, tmin, tmax) {
      return (this.clamp(v, fmin, fmax) - fmin) / (fmax - fmin);
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

  }, {
    key: "scale",
    value: function scale(v, fmin, fmax, tmin, tmax) {
      return this.magnitude(v, fmin, fmax, tmin, tmax) * (tmax - tmin) + tmin;
    }
  }]);

  return ColorScale;
}();

/**
 * Predefined color scale for wind speed.
 * @type {ColorScale}
 */


exports.default = ColorScale;
ColorScale.uvgrd = new ColorScale(5, [0, 17], [4, 9]);

/**
 * Predefined color scale for temperature.
 * @type {ColorScale}
 */
ColorScale.tmp = new ColorScale(223.5, [263.5, 323.5], [5, 8], [1, 4, 3]);

/**
 * Predefined color scale for precipitation.
 * @type {ColorScale}
 */
ColorScale.prate = new ColorScale(1e-4, [0, 1e-2], [3, 5], [2, 0, 4]);