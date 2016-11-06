'use strict';

const exec = require('child_process').exec;
const lighthouse = require('lighthouse/lighthouse-cli/bin.js').launchChromeAndRun;

const defaultOptions = {
  url: "",
  perf: false,
  disableDeviceEmulation: false,
  disableCPUThrottling: true,
  disableNetworkThrottling: false,
  saveAssets: false,
  saveArtifacts: false,
  configPath: '',
  logLevel: 'info',
  skipAutolaunch: false,
  selectChrome: false,
  doBetterWeb: false
};

function validateInput(options) {
  if (typeof options.disableDeviceEmulation === 'string') {
    options.disableDeviceEmulation = String(options.disableDeviceEmulation);
  }
  if (typeof options.disableCPUThrottling === 'string') {
    options.disableCPUThrottling = String(options.disableCPUThrottling);
  }
  if (typeof options.disableNetworkThrottling === 'string') {
    options.disableNetworkThrottling = String(options.disableNetworkThrottling);
  }
  if (typeof options.saveAssets === 'string') {
    options.saveAssets = String(options.saveAssets);
  }
  if (typeof options.saveArtifacts === 'string') {
    options.saveArtifacts = String(options.saveArtifacts);
  }
  if (typeof options.perf === 'string') {
    options.perf = String(options.perf);
  }
  if (!!options.configPath.length) {
    options.configPath = 'lighthouse/lighthouse-core/config/config.js';
  }
  if (!!options.perf === true) {
    options.configPath = 'lighthouse/lighthouse-core/config/perf.json';
  }
  if (!!options.doBetterWeb === true) {
    options.configPath = 'lighthouse/lighthouse-core/config/dobetterweb.json';
  }
  return options;
}

function mergeOptions(options, defaults) {
  for (let key in defaults) {
    if (options.hasOwnProperty(key)) {
      defaults[key] = options[key];
    }
  }
  return defaults;
}

class WebpackLighthousePlugin {
  constructor(options) {
    this.options = validateInput(mergeOptions(options, defaultOptions));
  }

  apply(compiler) {
    compiler.plugin('after-emit', () => {
      if (this.options.url.length) {
        lighthouse([this.options.url], require(this.options.configPath), defaultOptions);
      }
    });
  }
}

module.exports = WebpackLighthousePlugin;
