var gulp = require('gulp'),
  watch = require('gulp-watch'),
  concat = require('gulp-concat'),
  ngAnnotate = require('gulp-ng-annotate'),
  rename = require('gulp-rename'),
  uglify = require('gulp-uglify'),
  jshint = require('gulp-jshint'),
  gutil = require('gulp-util'),
  minifyCSS = require('gulp-minify-css'),
  autoprefixer = require('gulp-autoprefixer');

var path = {
  scripts: [
    'public/bower_components/moment/moment.js',
    'public/bower_components/jquery/dist/jquery.js',
    'public/bower_components/bootstrap/dist/js/bootstrap.js',
    'public/bower_components/angular/angular.js',
    'public/bower_components/angular-bootstrap-datetimepicker/src/js/datetimepicker.js',
    'public/bower_components/angular-loading-bar/build/loading-bar.min.js',
    'public/bower_components/angular-animate/angular-animate.min.js',
    'public/bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
    'app/controllers/appController.client.js',
    'app/controllers/appFactory.client.js',
    'app/controllers/appCreateCalendarController.client.js',
    'app/controllers/appCreateSheetController.client.js',
    'app/controllers/appDirective.client.js'
  ],
  styles: [
    'public/bower_components/angular-bootstrap-datetimepicker/src/css/datetimepicker.css',
    'public/bower_components/angular-loading-bar/build/loading-bar.css',
    'public/css/main.css'
  ]
};

gulp.task('default', function() {
  console.log('Hello Gulp');
});

gulp.task('uglify-js', function() {
  gulp.src(path.scripts)
    .pipe(concat('app'))
    .pipe(ngAnnotate())
    .pipe(uglify().on('error', gutil.log))
    .pipe(rename({
      extname: ".min.js"
    }))
    .pipe(gulp.dest('public/js'));
});

// create task concat, prefix, minify css
gulp.task('css', function() {
  gulp.src(path.styles)
    .pipe(concat('style'))
    .pipe(minifyCSS())
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9'))
    .pipe(rename({
      extname: ".min.css"
    }))
    .pipe(gulp.dest('public/css'));
});

// configure the jshint task
gulp.task('jshint', function() {
  return gulp.src('app/controllers/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});
