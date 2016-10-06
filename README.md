# gfs-weather-leaflet

Leaflet layer for rendering data from gfs-weather-server on leaflet maps.

## Installation

  `npm i gfs-weather-leaflet --save`

## Usage

```javascript
import {GFSLayer, ColorScale} from 'gfs-weather-leaflet'
const map = /* ... */

new GFSLayer({
  type: 'prate',
  surface: 'surface',
  date: new Date(new Date().setUTCHours(0, 0, 0, 0)),
  forecast: 0,
  baseUrl: 'http://gfs.weather.server'
})
.addTo(map)
```

## License

This package is licensed under the MIT license. See [MIT](LICENSE.md) for details.
