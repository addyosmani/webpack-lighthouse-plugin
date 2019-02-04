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
'use strict';
const _SIGINT = 'SIGINT';
const _ERROR_EXIT_CODE = 130;
const _RUNTIME_ERROR_CODE = 1;

const path = require('path');
const Printer = require('lighthouse/lighthouse-cli/printer');
const assetSaver = require('lighthouse/lighthouse-core/lib/asset-saver.js');
const getFilenamePrefix = require('lighthouse/lighthouse-core/lib/file-namer').getFilenamePrefix;
const lighthouse = require('lighthouse');
const log = require('lighthouse-logger');
const chromeLauncher = require('chrome-launcher');

function saveResults(results, artifacts, flags) {
    let promise = Promise.resolve(results);
    const cwd = process.cwd();
    // Use the output path as the prefix for all generated files.
    // If no output path is set, generate a file prefix using the URL and date.

    const configuredPath = !flags.outputPath || flags.outputPath === 'stdout' ?
        getFilenamePrefix(results.lhr) :
        flags.outputPath.replace(/\.\w{2,4}$/, '');
    const resolvedPath = path.resolve(cwd, configuredPath);
    if (flags.saveArtifacts) {
      assetSaver.saveArtifacts(artifacts, resolvedPath);
    }
  
    if (flags.saveAssets) {
      promise = promise.then(_ => assetSaver.saveAssets(results.artifacts, results.audits, resolvedPath));
    }
  
    const typeToExtension = (type) => type === 'domhtml' ? 'html' : type;
    return promise.then(_ => {
      if (Array.isArray(flags.output)) {
        return flags.output.reduce((innerPromise, outputType) => {
          const outputPath = `${resolvedPath}.report.${typeToExtension(outputType)}`;
          return innerPromise.then((_) => Printer.write(results, outputType, outputPath));
        }, Promise.resolve(results));
      } else {
        const outputPath =
            flags.outputPath || `${resolvedPath}.report.${typeToExtension(flags.output)}`;
        return Printer.write(results.report, flags.output, outputPath).then(results => {
          if (flags.output === Printer.OutputMode[Printer.OutputMode.html] ||
              flags.output === Printer.OutputMode[Printer.OutputMode.domhtml]) {
            if (flags.view) {
              opn(outputPath, {wait: false});
            } else {
              log.log(
                  'CLI',
                  'Protip: Run lighthouse with `--view` to immediately open the HTML report in your browser');
            }
          }
  
          return results;
        });
      }
    });
  }

const cleanup = {
    fns: [],
    register(fn) { this.fns.push(fn); },
    doCleanup() { return Promise.all(this.fns.map((c) => c())); }
};
function launchChromeAndRun(addresses, config, opts) {
    opts = opts || {};
    const launcher = new chromeLauncher.Launcher({
        autoSelectChrome: !opts.selectChrome,
    });
    cleanup.register(() => launcher.kill());
    return launcher
        .isDebuggerReady()
        .catch(() => {
        log.log('Lighthouse CLI', 'Launching Chrome...');
        return chromeLauncher.launch().then(chrome => chrome)
        })
        .then((chrome) => lighthouseRun(addresses, config, opts.lighthouseFlags, chrome))
        .then((chrome) => chrome.kill())
        .then(_ => Promise.resolve());
}
exports.launchChromeAndRun = launchChromeAndRun;
function lighthouseRun(addresses, config, lighthouseFlags, chrome) {
    // Enable a programatic consumer to pass custom flags otherwise default to CLI.
    lighthouseFlags = lighthouseFlags || flags;
    lighthouseFlags.logLevel = lighthouseFlags.logLevel || 'info';
    lighthouseFlags.output = lighthouseFlags.output || 'html';
    log.setLevel(lighthouseFlags.logLevel);
    lighthouseFlags.port = chrome.port;
    // Process URLs once at a time
    const address = addresses.shift();
    if (!address) {
        return chrome;
    }
    return lighthouse(address, lighthouseFlags)
    .then((results) => {
        const artifacts = results.artifacts;
        delete results.artifacts;
        return saveResults(results, artifacts, lighthouseFlags);
    })
    .then((results) => {
        return lighthouseRun(addresses, config, lighthouseFlags, chrome);
    }).then(result => result);

}
function showConnectionError() {
    console.error('Unable to connect to Chrome');
    console.error('If you\'re using lighthouse with --skip-autolaunch, ' +
        'make sure you\'re running some other Chrome with a debugger.');
    process.exit(_RUNTIME_ERROR_CODE);
}
function showRuntimeError(err) {
    console.error('Runtime error encountered:', err);
    if (err.stack) {
        console.error(err.stack);
    }
    process.exit(_RUNTIME_ERROR_CODE);
}
function handleError(err) {
    if (err.code === 'ECONNREFUSED') {
        showConnectionError();
    }
    else {
        showRuntimeError(err);
    }
}
function run(addresses, config, lighthouseFlags) {
    if (lighthouseFlags.skipAutolaunch) {
        return lighthouseRun(addresses, config, lighthouseFlags).catch(handleError);
    }
    else {
        // because you can't cancel a promise yet
        const isSigint = new Promise((resolve, reject) => {
            process.on(_SIGINT, () => reject(_SIGINT));
        });
        return Promise
            .race([launchChromeAndRun(addresses, config, {
                lighthouseFlags: lighthouseFlags
            }), isSigint])
            .catch(maybeSigint => {
            if (maybeSigint === _SIGINT) {
                return cleanup
                    .doCleanup()
                    .catch(err => {
                    console.error(err);
                    console.error(err.stack);
                }).then(() => process.exit(_ERROR_EXIT_CODE));
            }
            return handleError(maybeSigint);
        });
    }
}
exports.run = run;
