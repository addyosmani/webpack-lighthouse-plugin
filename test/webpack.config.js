const webpack = require("webpack");
const path = require("path");
const WebpackLighthousePlugin = require('../lib/');

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