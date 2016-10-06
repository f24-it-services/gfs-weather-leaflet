'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ValueField2 = require('./ValueField');

var _ValueField3 = _interopRequireDefault(_ValueField2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var VectorField = function (_ValueField) {
  _inherits(VectorField, _ValueField);

  function VectorField() {
    _classCallCheck(this, VectorField);

    return _possibleConstructorReturn(this, (VectorField.__proto__ || Object.getPrototypeOf(VectorField)).apply(this, arguments));
  }

  _createClass(VectorField, [{
    key: 'interpolate',
    value: function interpolate(x, y, g00, g10, g01, g11) {
      return [this.__interpolate(x, y, g00[0], g10[0], g01[0], g11[0]), this.__interpolate(x, y, g00[1], g10[1], g01[1], g11[1])];
    }
  }]);

  return VectorField;
}(_ValueField3.default);

exports.default = VectorField;


VectorField.fromFeatures = function (bounds, dx, dy, features) {
  return _ValueField3.default.fromFeatures(bounds, dx, dy, features, function (bounds, dx, dy, field) {
    return new VectorField(bounds, dx, dy, field);
  });
};