'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _pbf = require('pbf');

var _pbf2 = _interopRequireDefault(_pbf);

var _geobuf = require('geobuf');

var _geobuf2 = _interopRequireDefault(_geobuf);

var _leaflet = require('leaflet');

var _leaflet2 = _interopRequireDefault(_leaflet);

var _VectorField = require('./VectorField');

var _VectorField2 = _interopRequireDefault(_VectorField);

var _ValueField = require('./ValueField');

var _ValueField2 = _interopRequireDefault(_ValueField);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_superagent2.default.parse['application/x-protobuf'] = function (buffer) {
  return new _pbf2.default(buffer);
};


var DOT_SIZE = 20;
var DOT_DENSITY = 5;

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
exports.default = _leaflet2.default.GridLayer.extend({
  initialize: function initialize(options) {
    _leaflet2.default.setOptions(this, options);
  },


  /**
   * Creates a canvas tile and waits for the data from the weather server before
   * rendering to the canvas.
   */
  createTile: function createTile(coords, done) {
    // const key = this._tileCoordsToKey(coords)
    // console.time(`${key} total`)
    var tile = _leaflet2.default.DomUtil.create('canvas', 'leaflet-tile');
    var colorScale = this.options.colorScale;

    var ctx = tile.getContext('2d');
    var size = this.getTileSize();
    var map = this._map;

    tile.width = size.x;
    tile.height = size.y;

    var nw = coords.scaleBy(size);
    var se = nw.add(size);
    var colorMap = {};

    // console.time(`${key} load`)
    this.loadData(coords, function (err, data) {
      if (err) return console.error(err);
      // console.timeEnd(`${key} load`)

      // console.time(`${key} render total`)
      // console.time(`${key} colormap`)
      for (var y = nw.y - DOT_SIZE; y < se.y + DOT_SIZE; y += DOT_DENSITY) {
        for (var x = nw.x - DOT_SIZE; x < se.x + DOT_SIZE; x += DOT_DENSITY) {
          var latlng = map.unproject([x, y], coords.z);
          var value = data.get([latlng.lat, latlng.lng]);

          var colorValues = colorScale.getColor(value);
          if (colorValues !== null) {
            var _colorValues = _slicedToArray(colorValues, 3),
                r = _colorValues[0],
                g = _colorValues[1],
                b = _colorValues[2];

            var color = 'rgba(' + r + ', ' + g + ', ' + b + ', 0.02)';
            var point = [x - nw.x, y - nw.y];

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(point[0] + Math.random() * 3, point[1] + Math.random() * 3, DOT_SIZE, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();

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

      done(null, tile);
      // console.timeEnd(`${key} total`)
    });

    return tile;
  },


  /**
   * Loads data for a given tile.
   */
  loadData: function loadData(tile, cb) {
    var _this = this;

    var key = this._tileCoordsToKey(tile);
    // console.log(`tile ${tile.x}:${tile.y}@${tile.z}`)

    var map = this._map;
    var size = this.getTileSize();
    var nwPx = tile.scaleBy(size);
    var sePx = nwPx.add(size);

    // console.log(`px bounds ${nwPx.x}:${nwPx.y} - ${sePx.x}:${sePx.y}`)

    nwPx = nwPx.subtract([DOT_SIZE, DOT_SIZE]);
    sePx = sePx.add([DOT_SIZE, DOT_SIZE]);

    // console.log(`px bounds ${nwPx.x}:${nwPx.y} - ${sePx.x}:${sePx.y}`)
    // nwPx.subtract([DOT_SIZE * 2, DOT_SIZE * 2])
    // sePx.add([DOT_SIZE * 4, DOT_SIZE * 4])

    var nw = map.unproject(nwPx, tile.z);
    var se = map.unproject(sePx, tile.z);

    // console.log(`geo bounds ${nw.lng}:${nw.lat} - ${se.lng}:${se.lat}`)

    var resolution = Math.max(1, (6 - tile.z) * 2);
    var nwLat = nw.lat + resolution - nw.lat % resolution;
    var nwLng = nw.lng - resolution - nw.lng % resolution;
    var seLat = se.lat - resolution - se.lat % resolution;
    var seLng = se.lng + resolution - se.lng % resolution;

    if (Math.abs(seLng - nwLng) >= 360) {
      nwLng = -180;
      seLng = 180 - resolution;
    }

    var bounds = [nwLng, Math.min(90, nwLat), seLng, Math.max(-90, seLat)];

    // console.log('bounds', bounds)
    var time = this.getCurrentDate().getTime();
    // console.time(`${key} io`)
    _superagent2.default.get(this.options.baseUrl + '/layer/' + this.options.type + '/' + time).query({ bb: bounds.join(','), sf: resolution }).responseType('arraybuffer').end(function (err, res) {
      if (err) return cb(err);
      // console.timeEnd(`${key} io`)
      // console.time(`${key} parse`)
      var points = _geobuf2.default.decode(res.body);
      var grid = points.features.shift();
      var _grid$properties = grid.properties,
          dx = _grid$properties.dx,
          dy = _grid$properties.dy,
          bounds = _grid$properties.bounds;

      var field = void 0;
      // console.timeEnd(`${key} parse`)

      // console.log(`${nw.lng}:${nw.lat} - ${se.lng}:${se.lat}`)

      // console.time(`${key} parse=>prepare`)
      if (_this.options.type === 'uvgrd') {
        field = new _VectorField2.default(bounds, dx, dy, points.features);
      } else {
        field = new _ValueField2.default(bounds, dx, dy, points.features);
      }
      // console.timeEnd(`${key} parse=>prepare`)

      // console.log(field)

      cb(null, field);
    });
  },


  /**
   * Returns the currently displayed date (base date + forecast offset).
   */
  getCurrentDate: function getCurrentDate() {
    return new Date(this.options.date.getTime() + this.options.forecast * 3600000);
  },


  /**
   * Changes the forecast offset, will cause a redraw of all tiles.
   */
  setForecast: function setForecast(hour) {
    this.options.forecast = hour;
    if (this._map) this.redraw();
  }
});