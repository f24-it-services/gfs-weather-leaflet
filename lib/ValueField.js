"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ValueField = function () {
  function ValueField(bounds, dlng, dlat, features) {
    var _this = this;

    _classCallCheck(this, ValueField);

    this.dlng = dlng;
    this.dlat = dlat;
    this.tlng = this.__unwrapLng(bounds[0]);
    this.tlat = this.__unwrapLat(bounds[1]);
    this.nx = this.__x(this.__unwrapLng(bounds[2])) + 1;
    this.ny = this.__y(this.__unwrapLat(bounds[3])) + 1;
    // console.log(`${bounds[0]}:${bounds[1]}-${bounds[2]}:${bounds[3]} => ${this.tlng}:${this.tlat} + ${this.nx}:${this.ny}`)

    this.data = new Array(features.length);

    features.forEach(function (f) {
      var lnglat = f.geometry.coordinates;
      var value = f.properties.value;
      var lng = _this.__unwrapLng(lnglat[0]);
      var lat = _this.__unwrapLat(lnglat[1]);
      var x = _this.__x(lng);
      var y = _this.__y(lat);
      var i = _this.__i(x, y);

      _this.data[i] = value;
    });
  }

  _createClass(ValueField, [{
    key: "__unwrapLng",
    value: function __unwrapLng(lng) {
      return (lng % 360 + 180) % 360;
    }
  }, {
    key: "__unwrapLat",
    value: function __unwrapLat(lat) {
      return 90 - lat;
    }
  }, {
    key: "__x",
    value: function __x(lng) {
      var x = lng - this.tlng;
      // If bounds cross the date line we need to componsate by adding 360deg
      return (x < 0 ? x + 360 : x) / this.dlng;
    }
  }, {
    key: "__y",
    value: function __y(lat) {
      return (lat - this.tlat) / this.dlat;
    }
  }, {
    key: "__i",
    value: function __i(x, y) {
      return y * this.nx + x;
    }
  }, {
    key: "__get",
    value: function __get(x, y) {
      return this.data[this.__i(x, y)];
    }
  }, {
    key: "get",
    value: function get(_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
          lat = _ref2[0],
          lng = _ref2[1];

      var xf = this.__x(this.__unwrapLng(lng));
      var yf = this.__y(this.__unwrapLat(lat));
      var x = Math.floor(xf);
      var y = Math.floor(yf);

      var g00 = this.__get(x, y);
      var g10 = this.__get(x + 1, y);
      var g01 = this.__get(x, y + 1);
      var g11 = this.__get(x + 1, y + 1);

      if (!g00 || !g10 || !g01 || !g11) {
        return null;
      }

      return this.interpolate(xf - x, yf - y, g00, g10, g01, g11);
    }
  }, {
    key: "interpolate",
    value: function interpolate(x, y, g00, g10, g01, g11) {
      return [this.__interpolate(x, y, g00[0], g10[0], g01[0], g11[0])];
    }
  }, {
    key: "__interpolate",
    value: function __interpolate(x, y, g00, g10, g01, g11) {
      var rx = 1 - x;
      var ry = 1 - y;

      var a = rx * ry;
      var b = x * ry;
      var c = rx * y;
      var d = x * y;

      return g00 * a + g10 * b + g01 * c + g11 * d;
    }
  }]);

  return ValueField;
}();

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


exports.default = ValueField;