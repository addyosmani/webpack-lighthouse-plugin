/**
 * @license
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const lighthouse = require('./lighthouse-bin.js').run;
let configPath;

const defaultOptions = {
    url: '',
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
    configPath = 'lighthouse/lighthouse-core/config/perf-config.js';
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
    compiler.hooks.afterEmit.tapAsync('lighthousePlugin', (compilation, callback) => {
      if (this.options.url.length) {
        const flags = {
          lighthouseFlags: this.options
        };
        if(configPath) {
           lighthouse([this.options.url], require(configPath), flags);
        } else {
           lighthouse([this.options.url], configPath, flags);
        }
      }
      callback();
    });
  }
}

module.exports = WebpackLighthousePlugin;