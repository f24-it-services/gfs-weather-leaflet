"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ValueField = function () {
  function ValueField(bounds, dlat, dlng, field) {
    _classCallCheck(this, ValueField);

    this.bounds = bounds;
    this.dlat = dlat;
    this.dlng = dlng;
    this.field = field;
  }

  _createClass(ValueField, [{
    key: "get",
    value: function get(latlng) {
      var yf = (this.bounds[0] - latlng[0]) / this.dlat;
      var xf = (latlng[1] - this.bounds[1]) / this.dlng;
      var y = Math.floor(yf);
      var x = Math.floor(xf);
      var yc = y + 1;
      var xc = x + 1;

      var tr = this.field[y];
      var br = this.field[yc];

      if (!tr || !br) {
        return null;
      }

      var g00 = tr[x] && tr[x][1];
      var g10 = tr[xc] && tr[xc][1];
      var g01 = br[x] && br[x][1];
      var g11 = br[xc] && br[xc][1];

      if (!g00 || !g10 || !g01 || !g11) {
        return null;
      }

      return this.interpolate(xf - x, yf - y, g00, g10, g01, g11);
    }
  }, {
    key: "forEach",
    value: function forEach(cb) {
      var field = this.field;
      for (var y = 0, yl = field.length; y < yl; y++) {
        // eslint-disable-line
        var row = field[y];
        if (!row) continue;
        for (var x = 0, xl = row.length; x < xl; x++) {
          // eslint-disable-line
          var v = row[x];
          if (v) cb(v[0], v[1]);
        }
      }
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

exports.default = ValueField;


ValueField.fromFeatures = function (bounds, dlat, dlng, features, factoryFn) {
  var field = [];

  features.forEach(function (feature) {
    var lnglat = feature.geometry.coordinates;
    var latlng = [lnglat[1], lnglat[0]];
    var value = feature.properties.value;
    var y = Math.floor((bounds[0] - latlng[0]) / dlat);
    var x = Math.floor((latlng[1] - bounds[1]) / dlng);

    if (!field[y]) {
      field[y] = [];
    }

    field[y][x] = [latlng, value];
  });

  if (factoryFn) {
    return factoryFn(bounds, dlat, dlng, field);
  }

  return new ValueField(bounds, dlat, dlng, field);
};