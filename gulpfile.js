/*
  gulpfile.js
  ===========
  This is a simplified all-in-one gulpfile that defines all tasks directly
  to ensure compatibility with newer versions of Node.js and Gulp.
*/

'use strict';

var gulp = require('gulp');
var browserSync = require('browser-sync');
var jshint = require('gulp-jshint');
var browserify = require('browserify');
var watchify = require('watchify');
var fs = require('fs');
var path = require('path');

// Load config
var config = require('./gulp/config');

// Error handler
var handleErrors = function() {
    var args = Array.prototype.slice.call(arguments);
    console.error(args[0].toString());
    this.emit('end');
};

// Bundle logger
var bundleLogger = {
    start: function(filepath) {
        console.log('Bundling ' + filepath + '...');
    },
    watch: function(bundleName) {
        console.log('Watching files required by ' + bundleName);
    },
    end: function(filepath) {
        console.log('Bundled ' + filepath);
    }
};

// Browserify task
var browserifyTask = function(callback, devMode) {
    var bundleQueue = config.browserify.bundleConfigs.length;

    var browserifyThis = function(bundleConfig) {
        if (devMode) {
            // Add watchify args and debug (sourcemaps) option
            bundleConfig.debug = true;
            // Ignore external/require in dev mode
            delete bundleConfig.external;
            delete bundleConfig.require;
        }

        var b = browserify(bundleConfig);

        // Apply transforms here
        if (bundleConfig.transform) {
            bundleConfig.transform.forEach(function(t) {
                b.transform(t);
            });
        }

        var bundle = function() {
            // Log when bundling starts
            bundleLogger.start(bundleConfig.outputName);

            // Make sure the destination directory exists
            var destDir = path.dirname(path.join(bundleConfig.dest, bundleConfig.outputName));
            try {
                if (!fs.existsSync(destDir)) {
                    fs.mkdirSync(destDir, { recursive: true });
                }
            } catch (err) {
                console.error('Error creating directory:', err);
            }

            // Bundle and write to file
            b.bundle(function(err, src) {
                if (err) {
                    console.error(err.toString());
                    return;
                }
                
                // Write the file directly
                var outputPath = path.join(bundleConfig.dest, bundleConfig.outputName);
                try {
                    fs.writeFileSync(outputPath, src);
                    console.log('Written to:', outputPath);
                } catch (err) {
                    console.error('Error writing file:', err);
                }
                
                // Report finished
                bundleLogger.end(bundleConfig.outputName);
                
                // Decrement the bundle queue
                bundleQueue--;
                if (bundleQueue === 0) {
                    callback();
                }
                
                // Reload browser
                if (browserSync.active) {
                    browserSync.reload();
                }
            });
        };

        if (devMode) {
            // Wrap with watchify and rebundle on changes
            b = watchify(b);
            // Rebundle on update
            b.on('update', bundle);
            bundleLogger.watch(bundleConfig.outputName);
        } else {
            // Sort out shared dependencies
            if (bundleConfig.require) b.require(bundleConfig.require);
            if (bundleConfig.external) b.external(bundleConfig.external);
        }

        return bundle();
    };

    // Start bundling with Browserify for each bundleConfig specified
    config.browserify.bundleConfigs.forEach(browserifyThis);
};

// Define the browserify task
gulp.task('browserify', function(done) {
    browserifyTask(done, false);
});

// Define the watchify task
gulp.task('watchify', function(done) {
    browserifyTask(done, true);
});

// Define the browserSync task
gulp.task('browserSync', function(done) {
    browserSync(config.browserSync);
    done();
});

// Lint task
gulp.task('lint', function() {
    return gulp.src(config.lint.src)
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'));
});

// Watch task
gulp.task('watch', gulp.series('watchify', 'browserSync', 'lint', function(done) {
    // Watch .js files for linting
    gulp.watch(config.lint.src, gulp.series('lint'));
    // Watch task runs continuously, so we don't call done()
}));

// Default task
gulp.task('default', gulp.series('watch'));

