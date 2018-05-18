'use strict';

var gulp = require('gulp');
var minifyCss = require('gulp-minify-css');  //css压缩
var concat = require('gulp-concat');           //js合并
var jshint = require('gulp-jshint');           //js规范验证
var uglify = require('gulp-uglify');           //js压缩
var less = require('gulp-less');               // less编译
var rename = require('gulp-rename');          //文件名命名
var imagemin = require('gulp-imagemin');     //图片压缩
var del = require('del');
var vinylPaths = require('vinyl-paths');
var gutil = require('gulp-util');
var browserify = require("browserify");
var sourcemaps = require("gulp-sourcemaps");
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

gulp.task('default', ['del', 'compress']);

gulp.task('del', function () {
    return gulp.src('public/js/*.min.js')
        .pipe(vinylPaths(del));
});
gulp.task('compress', ['del'], function () {
    return gulp.src('public/js/*.js')
        // .pipe(uglify())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('public/js/'));
});

gulp.task('angular', function () {
    return gulp.src([
        'bower_components/fastclick/lib/fastclick.js',
        'bower_components/qrcode-generator/js/qrcode.js',
        'bower_components/qrcode-decoder-js/lib/qrcode-decoder.js',
        'bower_components/moment/min/moment-with-locales.js',
        'bower_components/angular/angular.js',
        'bower_components/angular-ui-router/release/angular-ui-router.js',
        'bower_components/angular-foundation/mm-foundation-tpls.js',
        'bower_components/angular-moment/angular-moment.js',
        'bower_components/ng-lodash/build/ng-lodash.js',
        'bower_components/angular-qrcode/angular-qrcode.js',
        'bower_components/angular-gettext/dist/angular-gettext.js',
        'bower_components/angular-touch/angular-touch.js',
        'bower_components/angular-carousel/dist/angular-carousel.js',
        'bower_components/angular-ui-switch/angular-ui-switch.js',
        'bower_components/angular-elastic/elastic.js',
        'bower_components/ui-router-extras/release/ct-ui-router-extras.js'
    ])
        .pipe(concat('angular.js'))
        .pipe(gulp.dest('public/js'))
        .pipe(rename("angular.js"))
        .pipe(uglify())
        .pipe(gulp.dest('public/js'));
});

gulp.task('bng', function () {
    return gulp.src([
        'src/js/app.js',
        'src/js/init.js',
        'src/js/version.js',
        'src/js/controllers/*.js',
        'src/js/services/*.js',
        'src/js/models/*.js',
        'src/js/filters/*.js',
        'src/js/directives/*.js',
        'src/js/routes.js',
        'angular-bitcore-wallet-client/index.js',
    ])
        .pipe(concat('bng.js'))
        .pipe(gulp.dest('public/js'))
        .pipe(rename("bng.js"))
        .pipe(uglify())
        .pipe(gulp.dest('public/js'));
});
gulp.task("browserify", function () {
    var b = browserify({
        entries: [
            // 'src/js/app.js',
            // 'src/js/init.js',
            // 'src/js/version.js',
            'controllers/js/controllers/createwal.js',
            'controllers/js/controllers/signer.js',
            // 'controllers/js/services/configService.js',
            // 'controllers/js/services/storageService.js',
            // 'controllers/js/models/profile.js',
            // 'controllers/js/filters/*.js',
            // 'controllers/js/directives/*.js',
            // 'src/js/routes.js',
            // 'angular-bitcore-wallet-client/index.js',
        ], //入口点js
        debug: true //是告知Browserify在运行同时生成内联sourcemap用于调试
    });

    return b.bundle()
        .pipe(source("bng.js"))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .on('error', gutil.log)
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest("public/js"));
});

