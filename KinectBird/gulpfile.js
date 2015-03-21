(function (require) {
  'use strict';

  var gulp = require('gulp'),
      through2 = require('through2'),
      browserify = require('browserify'),
      babelify = require('babelify'),
      concat = require('gulp-concat'),
      config = {
        paths: {
          src: './js/ES6',
          dest: './js'
        }
      };


  gulp.task('compile-js', function () {
    return gulp.src(config.paths.src + '/init.js')
      .pipe(through2.obj(function (file, enc, next) {
        return browserify(file.path, { debug: true })
          .transform(babelify)
          .bundle(function (err, result) {
            if (err) {
              return next(err);
            }

            file.contents = result;
            next(null, file);
          });
      }))
      .pipe(concat('app.compiled.js'))
      .pipe(gulp.dest(config.paths.dest));
  });


  gulp.task('default', ['compile-js'], function () {
    gulp.watch([config.paths.src + '/**/*.js'], ['compile-js']);
  });

}).call(this, require);
