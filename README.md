[![npm version](https://badge.fury.io/js/webpack-lighthouse-plugin.svg)](https://badge.fury.io/js/webpack-lighthouse-plugin)
[![npm](https://img.shields.io/npm/dm/webpack-lighthouse-plugin.svg)]()
# Webpack Lighthouse Plugin

This plugin allows you to run Lighthouse at the end of a Webpack build.

## Installation

`npm install --save-dev webpack-lighthouse-plugin`

## Setup

In `webpack.config.js`:

```js
const WebpackShellPlugin = require('webpack-lighthouse-plugin');

module.exports = {
  ...
  ...
  plugins: [
    new WebpackLighthousePlugin({
        url: 'http://localhost:9001'
    })
  ],
  ...
}
```

## Example

Insert into your webpack.config.js:

```js
const WebpackLighthousePlugin = require('webpack-lighthouse-plugin');

module.exports = {
    entry: 'sample.js',
    output: {
        filename: 'test.js'
    },
	plugins: [
		new WebpackLighthousePlugin({
            url: 'https://airhorner.com'
        })
	],
};
```


### API
* `url` - the URL to run Lighthouse audits against
* `perf` - only report Lighthouse performance audits (instead of the full Progressive Web App audits)
* `disableDeviceEmulation` - disables device emulation (`false` by default)
* `disableCPUThrottling` - disables cpu throttling (`true` by default)
* `disableNetworkThrottling` - disables network throttling (`false` by default)
* `saveAssets` - save the trace contents & screenshots to disk   
* `saveArtifacts` - save all gathered artifacts to disk 

#### Examples

#### Performance metrics only

Just get the time to first meaningful paint, time-to-interactive and perceptual speed-index:

```js
	plugins: [
		new WebpackLighthousePlugin({
            url: 'https://airhorner.com',
            perf: true
        })
	],
```

### Test with CPU, network throttling and device emulation

```js
	plugins: [
		new WebpackLighthousePlugin({
            url: 'https://airhorner.com',
            disableCPUThrottling: false
        })
	],
```

#### Save build assets (screenshots, trace and report):

```js
	plugins: [
		new WebpackLighthousePlugin({
            url: 'https://airhorner.com',
            saveAssets: true
        })
	],
```

If you require even more data, you can also pass `saveArtifacts: true`.

### Developing

If opening a pull request, create an issue describing a fix or feature. Have your pull request point to 
the issue by writing your commits with the issue number in the message.

Make sure you lint your code by running `npm run lint` and you can build the library by running 
`npm run build`.

### License

Released under an Apache-2.0 license.