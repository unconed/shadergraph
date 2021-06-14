const gulp        = require('gulp');
const concat      = require('gulp-concat');
const compiler    = require('webpack');
const webpack     = require('webpack-stream');
const watch       = require('gulp-watch');
const karma       = require('karma');

const parseConfig = karma.config.parseConfig;
const KarmaServer = karma.Server;

const webpackConfig = require('./webpack.config.js');

const builds = {
  bundle: 'build/shadergraph.js',
  css:    'build/shadergraph.css',
};

const products = [
  builds.bundle
];

const css = [
  'src/**/*.css',
];

const files = [
  'src/**/*.js',
];

const bundle = [
  '.tmp/index.js'
];

const test = [
  'node_modules/three/three.js',
].concat(bundle).concat([
  'test/**/*.spec.js',
]);

gulp.task('pack', function() {
  return gulp
    .src('src/index.js')
    .pipe(
      webpack(webpackConfig,compiler, function(err, stats) {
      /* Use stats to do more things if needed */
      })
    ).pipe(gulp.dest('build/'));
});

gulp.task('css', function () {
  return gulp.src(css)
    .pipe(concat(builds.css))
    .pipe(gulp.dest('./'));
});

gulp.task('karma', function (done) {
  parseConfig(
    __dirname + '/karma.conf.js',
    {files: test, singleRun: true},
    { promiseConfig: true, throwErrors: true}
  ).then(
    (karmaConfig) => {
      new KarmaServer(karmaConfig, done).start();
    },
    (rejectReason) => {}
  );
});

gulp.task('watch-karma', function() {
  return gulp.src(test)
    .pipe(karma({
      configFile: 'karma.conf.js',
      action: 'watch',
    }));
});

gulp.task('watch-build-watch', function () {
  watch(files.concat(css), gulp.series('build'));
});

// Main tasks

const buildTask = gulp.series('pack', 'css');

gulp.task('default', buildTask);

gulp.task('build', buildTask);

gulp.task('test', gulp.series('build', 'karma'));

gulp.task('watch-build', gulp.series('build', 'watch-build-watch'));

gulp.task('watch', gulp.series('watch-build', 'watch-karma'));
