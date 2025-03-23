var gulp = require('gulp');
var jshint = require('gulp-jshint');
var config = require('../config');
var reporter = require('jshint-stylish');
var map = require('map-stream');

var errorReporter = function() {
    return map(function(file, cb) {
        if (!file.jshint.success) {
            console.log('\x07'); // ASCII bell character for beep
        }
        cb(null, file);
    });
};

gulp.task('lint', function() {
    return gulp.src(config.lint.src)
        .pipe(jshint())
        .pipe(jshint.reporter(reporter))
        .pipe(errorReporter());
});
