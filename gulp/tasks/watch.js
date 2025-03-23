/* Notes:
   - gulp/tasks/browserify.js handles js recompiling with watchify
   - gulp/tasks/browserSync.js watches and reloads compiled files
*/

var gulp = require('gulp');
var config = require('../config'); // Assuming this is how you're importing config

gulp.task('watch', gulp.series('watchify', 'browserSync', 'lint', function(callback) {
    // In Gulp 4, we need to use gulp.watch with a different syntax
    gulp.watch(config.lint.src, gulp.series('lint'));
    
    // If this is truly a watching task, we don't call the callback
    // If you want it to finish and continue to the next task, uncomment:
    // callback();
}));