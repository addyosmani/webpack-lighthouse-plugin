const exec = require('child_process').exec;
// TODO: Switch when https://github.com/GoogleChrome/lighthouse/pull/916 lands
// const lighthouse = require('lighthouse/lighthouse-cli/bin.js').launchChromeAndRun;
const lighthouse = require('./lighthouse-bin.js').launchChromeAndRun;
let configPath = 'lighthouse/lighthouse-core/config/default.json';

const defaultOptions = {
    url: "",
    perf: false,
    disableDeviceEmulation: false,
    disableCPUThrottling: true,
    disableNetworkThrottling: false,
    saveAssets: false,
    saveArtifacts: false
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
  if (options.perf === true) {
    configPath = 'lighthouse/lighthouse-core/config/perf.json';
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
        const flags = {
          lighthouseFlags: this.options
        };
        lighthouse([this.options.url], require(configPath), flags);
      }
    });
  }
}

module.exports = WebpackLighthousePlugin;