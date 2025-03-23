/* bundleLogger
   ------------
   Provides gulp style logs to the bundle method in browserify.js
*/

var log = require('fancy-log');
var colors = require('ansi-colors');
var prettyHrtime = require('pretty-hrtime');
var startTime;

module.exports = {
    start: function(filepath) {
        startTime = process.hrtime();
        log('Bundling', colors.green(filepath) + '...');
    },

    watch: function(bundleName) {
        log('Watching files required by', colors.yellow(bundleName));
    },

    end: function(filepath) {
        var taskTime = process.hrtime(startTime);
        var prettyTime = prettyHrtime(taskTime);
        log('Bundled', colors.green(filepath), 'in', colors.magenta(prettyTime));
    }
};
