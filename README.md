[![npm version](https://badge.fury.io/js/webpack-lighthouse-plugin.svg)](https://badge.fury.io/js/webpack-lighthouse-plugin)
[![npm](https://img.shields.io/npm/dm/webpack-lighthouse-plugin.svg)]()
# Webpack Lighthouse Plugin

This plugin allows you to run [Lighthouse](https://github.com/googlechrome/lighthouse) from a Webpack build.

## Installation

`npm install --save-dev webpack-lighthouse-plugin`

## Setup

In `webpack.config.js`:

```js
const WebpackLighthousePlugin = require('webpack-lighthouse-plugin');

module.exports = {
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

### Running `webpack-lighthouse-plugin` with real mobile devices

Similar to the Lighthouse module, this plugin can also be used with real phones. It works over [remote debugging](https://github.com/GoogleChrome/lighthouse#lighthouse-w-mobile-devices)
using the [Android command line tools](http://developer.android.com/sdk/index.html#download).

Before running the plugin as part of your Webpack build, run the following commands:

```
$ adb kill-server
$ adb devices -l
$ adb forward tcp:9222 localabstract:chrome_devtools_remote
``` 

You can then run `webpack` against your build and instead of firing up a Chrome instance on desktop, it'll do this with
your mobile device Chrome instead. You will want to disable a few flags to improve the accuracy of your metrics:

```js
	plugins: [
		new WebpackLighthousePlugin({
            url: 'https://localhost:9000', // Port you are locally serving on
            disableDeviceEmulation: true,
            disableCPUThrottling: true,
            disableNetworkThrottling: true // Only if you're going to use real 3G
        })
	],
```

### Webpack Dev Server

*Note: Webpack Dev Server targets development builds rather than production. Although
you can run Lighthouse against a dev build, it's best run against builds closer to prod.*

If you're trying to use [webpack-dev-server](https://webpack.github.io/docs/webpack-dev-server.html) with
this plugin, first run it against your local build using the `webpack-dev-server` CLI:

```js
$ webpack-dev-server build/
  http://localhost:8080/webpack-dev-server/
 ```

Then make sure to reference the `webpack-dev-server` URL in your `WebpackLighthousePlugin` config:

 ```js
   plugins: [
    new WebpackLighthousePlugin({
      url: 'http://localhost:8080/webpack-dev-server/'
    })
  ]
 ```

### Developing

If opening a pull request, create an issue describing a fix or feature. Have your pull request point to 
the issue by writing your commits with the issue number in the message.

Make sure you lint your code by running `npm run lint` and you can build the library by running 
`npm run build`.

### License

Released under an Apache-2.0 license.