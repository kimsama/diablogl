var gulp = require('gulp');

gulp.task('default', function(done) {
  // Run the watch task when 'default' is called
  gulp.series('watch')(done);
});