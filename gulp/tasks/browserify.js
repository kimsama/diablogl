/* browserify task
   ---------------
   Bundle javascripty things with browserify!

   This task is set up to generate multiple separate bundles, from
   different sources, and to use Watchify when run from the default task.

   See browserify.bundleConfigs in gulp/config.js
*/

'use strict';

var browserify = require('browserify');
var browserSync = require('browser-sync');
var watchify = require('watchify');
var bundleLogger = require('../util/bundleLogger');
var gulp = require('gulp');
var handleErrors = require('../util/handleErrors');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var config = require('../config').browserify;
var babel = require('babelify');
var assign = require('lodash.assign');
var omit = require('lodash.omit');
var fs = require('fs');
var path = require('path');

var browserifyTask = function(callback, devMode) {

    var bundleQueue = config.bundleConfigs.length;

    var browserifyThis = function(bundleConfig) {

        if (devMode) {
            // Add watchify args and debug (sourcemaps) option
            assign(bundleConfig, watchify.args, {
                debug: true
            });
            // A watchify require/external bug that prevents proper recompiling,
            // so (for now) we'll ignore these options during development. Running
            // `gulp browserify` directly will properly require and externalize.
            bundleConfig = omit(bundleConfig, ['external', 'require']);
        }

        var b = browserify(bundleConfig)
            .transform(babel);

        var bundle = function() {
            // Log when bundling starts
            bundleLogger.start(bundleConfig.outputName);

            // Make sure the destination directory exists
            var destDir = path.dirname(path.join(bundleConfig.dest, bundleConfig.outputName));
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }

            // Directly write to file as a fallback approach
            var writeToFile = function(err, src) {
                if (err) {
                    handleErrors(err);
                    return;
                }
                
                // Write the file directly
                var outputPath = path.join(bundleConfig.dest, bundleConfig.outputName);
                fs.writeFileSync(outputPath, src);
                
                // Log completion
                reportFinished();
                
                // Notify browserSync
                if (browserSync.active) {
                    browserSync.reload();
                }
            };

            // Bundle and write to file
            b.bundle(function(err, src) {
                writeToFile(err, src);
            });
        };

        if (devMode) {
            // Wrap with watchify and rebundle on changes
            b = watchify(b);
            // Rebundle on update
            b.on('update', bundle);
            bundleLogger.watch(bundleConfig.outputName);
        } else {
            // Sort out shared dependencies.
            // b.require exposes modules externally
            if (bundleConfig.require) b.require(bundleConfig.require);
            // b.external excludes modules from the bundle, and expects
            // they'll be available externally
            if (bundleConfig.external) b.external(bundleConfig.external);
        }

        var reportFinished = function() {
            // Log when bundling completes
            bundleLogger.end(bundleConfig.outputName);

            if (bundleQueue) {
                bundleQueue--;
                if (bundleQueue === 0) {
                    // If queue is empty, tell gulp the task is complete.
                    // https://github.com/gulpjs/gulp/blob/master/docs/API.md#accept-a-callback
                    callback();
                }
            }
        };

        return bundle();
    };

    // Start bundling with Browserify for each bundleConfig specified
    config.bundleConfigs.forEach(browserifyThis);
};

gulp.task('browserify', browserifyTask);

// Exporting the task so we can call it directly in our watch task, with the 'devMode' option
module.exports = browserifyTask;
