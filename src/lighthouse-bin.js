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
const yargs = require('yargs');
const Printer = require('lighthouse/lighthouse-cli/printer');
const lighthouse = require('lighthouse/lighthouse-core');
const assetSaver = require('lighthouse/lighthouse-core/lib/asset-saver.js');
const log = require('lighthouse/lighthouse-core/lib/log');
const chrome_launcher_1 = require('lighthouse/lighthouse-cli/chrome-launcher');
const Commands = require('lighthouse/lighthouse-cli//commands/commands');
const perfOnlyConfig = require('lighthouse/lighthouse-core/config/perf.json');
// const cli = yargs
//     .help('help')
//     .version(() => require('lighthouse/package').version)
//     .showHelpOnFail(false, 'Specify --help for available options')
//     .usage('$0 url')
//     .group([
//     'verbose',
//     'quiet'
// ], 'Logging:')
//     .describe({
//     verbose: 'Displays verbose logging',
//     quiet: 'Displays no progress, debug logs or errors'
// })
//     .group([
//     'mobile',
//     'save-assets',
//     'save-artifacts',
//     'list-all-audits',
//     'list-trace-categories',
//     'config-path',
//     'perf'
// ], 'Configuration:')
//     .describe({
//     'disable-device-emulation': 'Disable Nexus 5X emulation',
//     'disable-cpu-throttling': 'Disable CPU throttling',
//     'disable-network-throttling': 'Disable network throttling',
//     'save-assets': 'Save the trace contents & screenshots to disk',
//     'save-artifacts': 'Save all gathered artifacts to disk',
//     'list-all-audits': 'Prints a list of all available audits and exits',
//     'list-trace-categories': 'Prints a list of all required trace categories and exits',
//     'config-path': 'The path to the config JSON.',
//     'perf': 'Use a performance-test-only configuration',
//     'skip-autolaunch': 'Skip autolaunch of Chrome when accessing port 9222 fails',
//     'select-chrome': 'Interactively choose version of Chrome to use when multiple installations are found',
// })
//     .group([
//     'output',
//     'output-path'
// ], 'Output:')
//     .describe({
//     'output': 'Reporter for the results',
//     'output-path': `The file path to output the results
// Example: --output-path=./lighthouse-results.html`
// })
//     .boolean([
//     'disable-device-emulation',
//     'disable-cpu-throttling',
//     'disable-network-throttling',
//     'save-assets',
//     'save-artifacts',
//     'list-all-audits',
//     'list-trace-categories',
//     'perf',
//     'skip-autolaunch',
//     'select-chrome',
//     'verbose',
//     'quiet',
//     'help'
// ])
//     .choices('output', Printer.GetValidOutputOptions())
//     .default('disable-cpu-throttling', true)
//     .default('output', Printer.GetValidOutputOptions()[Printer.OutputMode.pretty])
//     .default('output-path', 'stdout')
//     .check((argv) => {
//     // Make sure lighthouse has been passed a url, or at least one of --list-all-audits
//     // or --list-trace-categories. If not, stop the program and ask for a url
//     if (!argv.listAllAudits && !argv.listTraceCategories && argv._.length === 0) {
//         throw new Error('Please provide a url');
//     }
//     return true;
// })
//     .argv;

const cli = {};

// Process terminating command
if (cli.listAllAudits) {
    Commands.ListAudits();
}
// Process terminating command
if (cli.listTraceCategories) {
    Commands.ListTraceCategories();
}
const urls = cli._;
const outputMode = cli.output;
const outputPath = cli['output-path'];
const flags = cli;
let config = null;
if (cli.configPath) {
    // Resolve the config file path relative to where cli was called.
    cli.configPath = path.resolve(process.cwd(), cli.configPath);
    config = require(cli.configPath);
}
else if (cli.perf) {
    config = perfOnlyConfig;
}
// set logging preferences
flags.logLevel = 'info';
if (cli.verbose) {
    flags.logLevel = 'verbose';
}
else if (cli.quiet) {
    flags.logLevel = 'silent';
}
log.setLevel(flags.logLevel);
const cleanup = {
    fns: [],
    register(fn) { this.fns.push(fn); },
    doCleanup() { return Promise.all(this.fns.map((c) => c())); }
};
function launchChromeAndRun(addresses, config, opts) {
    opts = opts || cli;
    const launcher = new chrome_launcher_1.ChromeLauncher({
        autoSelectChrome: !opts.selectChrome,
    });
    cleanup.register(() => launcher.kill());
    return launcher
        .isDebuggerReady()
        .catch(() => {
        log.log('Lighthouse CLI', 'Launching Chrome...');
        return launcher.run();
    })
        .then(() => lighthouseRun(addresses, config, opts.lighthouseFlags))
        .then(() => launcher.kill());
}
exports.launchChromeAndRun = launchChromeAndRun;
function lighthouseRun(addresses, config, lighthouseFlags) {
    // Enable a programatic consumer to pass custom flags otherwise default to CLI.
    lighthouseFlags = lighthouseFlags || flags;
    // Process URLs once at a time
    const address = addresses.shift();
    if (!address) {
        return;
    }
    return lighthouse(address, lighthouseFlags, config)
        .then((results) => Printer.write(results, outputMode, outputPath))
        .then((results) => {
        if (outputMode === Printer.OutputMode[Printer.OutputMode.pretty]) {
            const filename = `./${assetSaver.getFilenamePrefix({ url: address })}.report.html`;
            Printer.write(results, 'html', filename);
        }
        return lighthouseRun(addresses, config, lighthouseFlags);
    });
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
function run(lighthouseFlags) {
    if (cli.skipAutolaunch) {
        lighthouseRun(urls, config, lighthouseFlags).catch(handleError);
    }
    else {
        // because you can't cancel a promise yet
        const isSigint = new Promise((resolve, reject) => {
            process.on(_SIGINT, () => reject(_SIGINT));
        });
        Promise
            .race([launchChromeAndRun(urls, config, {
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
