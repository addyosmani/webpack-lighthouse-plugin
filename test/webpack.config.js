const webpack = require("webpack");
const WebpackLighthousePlugin = require('../src/webpack-lighthouse-plugin');

module.exports = {
    entry: 'sample.js',
    output: {
        filename: 'test.js'
    },
	plugins: [
		new WebpackLighthousePlugin({
            url: 'https://airhorner.com',
            saveAssets: true,
            perf: true
        })
	],
};