var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var sass = require('gulp-sass');
var plumber = require('gulp-plumber');
var notify = require('gulp-notify');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var del = require('del');
var runSequence = require('run-sequence');
var watch = require('gulp-watch');

// SVG sprites
var svgmin = require('gulp-svgmin');
var cheerio = require('gulp-cheerio');
var replace = require('gulp-replace');
var svgSprite = require('gulp-svgsprite');
var rename = require('gulp-rename');

// Images
var imagemin = require('gulp-imagemin');


// HTML, CSS, JS
var usemin = require('gulp-usemin');
var htmlclean = require('gulp-htmlclean');
var uglify = require("gulp-uglify"); // Сжатие JS
var mincss = require("gulp-minify-css"); // Сжатие CSS
var rev = require('gulp-rev');
var rigger = require('gulp-rigger');
var minhtml = require('gulp-htmlmin');

gulp.task('server', function() {
	browserSync.init({
		server: { baseDir: './build/'}
	});


	watch('./src/scss/**/*.scss', function(){
		gulp.start('styles');
	});
	
	watch('./src/**/*.html', function(){
		gulp.start('html');
	});

    watch('./src/fonts/**/*.*', function(){
        gulp.start('fonts');
    });

	watch('./src/js/**/*.js', function(){
		gulp.start('copy:js');
	});

	watch('./src/libs/**/*.*', function(){
		gulp.start('copy:libs-local');
	});

	watch(['./src/img/**/*.*', '!./src/img/svg-for-sprites/**/*.svg'], function(){
		gulp.start('copy:img');
	});

	watch('./src/img/svg/*.svg', function(){
		gulp.start('svg');
	});
});


gulp.task('html', function () {
   gulp.src('./src/**/*.html')
       .pipe(rigger())
       .pipe(minhtml({collapseWhitespace: true}))
       .pipe(gulp.dest('./build/'))
       .pipe(browserSync.stream());
});

gulp.task('fonts', function () {
    gulp.src('./src/fonts/**/*.*')
        .pipe(gulp.dest('./build/fonts/'))
});

gulp.task('server:docs', function() {
	browserSync.init({
		server: { baseDir: './docs/'}
	});
});

gulp.task('styles', function() {
    return gulp.src('./src/scss/style.scss')
        .pipe(plumber({
            errorHandler: notify.onError(function (err) {
                return {
                    title: 'Styles',
                    message: err.message
                }
            })
        }))
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(autoprefixer({
            browsers: ['last 6 versions'],
            cascade: false
        }))
        .pipe(mincss())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./build/css'))
        .pipe(browserSync.stream());
});


gulp.task('svg', function() {
	return gulp.src('./src/img/svg-for-sprites/*.svg')
	.pipe(svgmin({
		js2svg: {
			pretty: true
		}
	}))
	.pipe(cheerio({
		run: function($) {
			$('[fill]').removeAttr('fill');
			$('[stroke]').removeAttr('stroke');
			$('[style]').removeAttr('style');
		},
		parserOptions: { xmlMode: true }
	}))
	.pipe(replace('&gt;', '>'))
	.pipe(svgSprite({
		mode: {
			symbol: {
				sprite: "sprite.svg"
			}
		}
	}))
	.pipe(rename('sprite.svg'))
	.pipe(gulp.dest('./build/img'));
});

// gulp.task('copy:libs', function(callback) {
//
//     gulp.src('node_modules/jquery/dist/**/*.*')
// 		.pipe(gulp.dest('./build/libs/jquery'))
//
// 	gulp.src('node_modules/bootstrap-4-grid/css/**/*.*')
// 		.pipe(gulp.dest('./build/libs/bootstrap-4-grid'))
//
// 	gulp.src('node_modules/normalize.css/normalize.css')
// 		.pipe(gulp.dest('./build/libs/normalize-css/'))
//
//     gulp.src('node_modules/animate.css/animate.min.css')
// 		.pipe(gulp.dest('./build/libs/animate-css/'))
//
// 	callback()
// });

gulp.task('copy:libs-local', function(callback) {
	gulp.src('./src/libs/**/*.*')
		.pipe(gulp.dest('./build/libs/'))
	callback()
});

gulp.task('copy:img', function() {
	return gulp.src(['./src/img/**/*.*', '!./src/img/svg-for-sprites/**/*.svg'])
		.pipe(gulp.dest('./build/img/'))
		.pipe(browserSync.stream());
});

gulp.task('copy:js', function() {
	return gulp.src('./src/js/**/*.*')
		.pipe(gulp.dest('./build/js'))
		.pipe(browserSync.stream());
});

gulp.task('clean:build', function() {
    return del('./build');
});

gulp.task('copy:build:files', function(callback) {
    gulp.src('./src/php/**/*.*')
        .pipe(gulp.dest('./build/php/'))
    gulp.src('./src/files/**/*.*')
        .pipe(gulp.dest('./build/files/'))
	gulp.src('./src/fonts/**/*.*')
	        .pipe(gulp.dest('./build/fonts/'))
	callback()
});

gulp.task('default', function(callback){
    runSequence(
    	'clean:build',
    	['styles', 'svg', 'html', 'fonts', 'copy:libs-local', 'copy:img', 'copy:js'],
    	'server',
		callback
    )
});


/* ------------------------------------
  DOCS TASKS
------------------------------------ */

gulp.task('clean:docs', function() {
    return del('./docs');
});

gulp.task('img:dist', function() {
    return gulp.src('./build/img/**/*.*')
	.pipe(imagemin({
		progressive: true,
		// optimizationLevel: 5,
		svgoPlugins: [{removeViewBox: false}],
		use: [pngquant()],
		interlaced: true
	}))
    .pipe(gulp.dest('./docs/img'));
});

gulp.task('copy:docs:files', function(callback) {
    gulp.src('./src/php/**/*.*')
        .pipe(gulp.dest('./dist/php/'))
    gulp.src('./src/files/**/*.*')
        .pipe(gulp.dest('./dist/files/'))
	gulp.src('./src/fonts/**/*.*')
	        .pipe(gulp.dest('./docs/fonts/'))
	callback()
});

// gulp.task('html:docs', function() {
//     return gulp.src('./build/**/*.html')
//     	.pipe(usemin({
//     		//  <!-- build:cssVendor css/vendor.css --> <!-- endbuild -->
// 			cssVendor: [function() { return rev() }, function() { return mincss() } ],
// 			cssCustom: [function() { return rev() }, function() { return mincss() } ],
// 			jsLibs: [function() { return rev() }, function() { return uglify() } ],
// 			jsVendor: [function() { return rev() }, function() { return uglify() } ],
// 			jsMain: [function() { return rev() }, function() { return uglify() } ]
//     	}))
// 		.pipe(htmlclean())
// 	.pipe(gulp.dest('./docs/'));
// });

gulp.task('docs', function(callback){
    runSequence(
		'clean:build',
    	['styles', 'svg', 'fonts','copy:libs-local', 'copy:img', 'copy:js'],
    	'clean:docs',
    	['img:dist', 'copy:docs:files'],
    	'server:docs',
		callback
    )
});