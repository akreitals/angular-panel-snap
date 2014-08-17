var gulp = require('gulp');

// load plugins
var plugins = require('gulp-load-plugins')();

// load tests config
var karmaConfigPath = './test/karma.conf.js';
var karmaConf = require(karmaConfigPath);

// globs and options
var sources = ['src/**/module.js', 'src/**/*.js'];
var targets = 'angular-panel-snap.{js,min.js,min.js.map}';
var taskOptions = {
	jshint: {
		eqeqeq: true,
		camelcase: true,
		freeze: true,
		immed: true,
		// latedef: true,
		newcap: true,
		undef: true,
		unused: true,
		browser: true,
		globals: {
			angular: false,
			console: false,
			HTMLDocument: false
		}
	},
	karma: {
		configFile: karmaConfigPath,
		dieOnError: false,
		action: 'run'
	}
}

// error function
var onError = function (err) {
	plugins.util.beep();
	plugins.util.log(err);
};

gulp.task('default', ['lint', 'test', 'clean', 'compile']);

gulp.task('watch', ['default'], function () {
	plugins.watch({glob: sources, emitOnGlob: false, name: 'Src'}, ['lint', 'test', 'compile']);
	plugins.watch({glob: karmaConf.testFiles, emitOnGlob: false, name: 'Tests'}, ['test']);
});

gulp.task('clean', function () {
	gulp.src(targets)
		.pipe(plugins.clean());
});

gulp.task('lint', function () {
	gulp.src(sources)
		.pipe(plugins.jshint(taskOptions.jshint))
		.pipe(plugins.jshint.reporter('default'));
});

gulp.task('test', function () {
	return gulp.src(karmaConf.testFiles)
		.pipe(plugins.karma(taskOptions.karma))
		.on('error', function (err) {
			throw err
		});
});

gulp.task('compile', function () {
	gulp.src(sources)
		.pipe(plugins.plumber({
			errorHandler: onError
		}))
		.pipe(plugins.wrap('(function() {\n\'use strict\';\n\n<%= contents %>\n\n})();\n\n'))
		.pipe(plugins.sourcemaps.init())
		.pipe(plugins.concat('angular-panel-snap.js'))
		.pipe(plugins.ngAnnotate())
		.pipe(gulp.dest('./'))
		.pipe(plugins.rename({
			suffix: '.min'
		}))
		.pipe(plugins.uglify({
			mangle: true
		}))
		.pipe(plugins.sourcemaps.write('./'))
		.pipe(gulp.dest('./'));
});