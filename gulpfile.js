const gulp        = require('gulp');
const uglify      = require('gulp-uglify');
const concat      = require('gulp-concat');
const rename      = require("gulp-rename");
const browserify  = require('browserify');
const watch       = require('gulp-watch');
const karma       = require('karma');
const vSource     = require('vinyl-source-stream');

const parseConfig = karma.config.parseConfig;
const KarmaServer = karma.Server;

const builds = {
  core:   'build/shadergraph-core.js',
  bundle: 'build/shadergraph.js',
  css:    'build/shadergraph.css',
};

const products = [
  builds.core,
  builds.bundle,
];

const vendor = [
];

const css = [
  'src/**/*.css',
];

const core = [
  '.tmp/index.js'
];

const files = [
  'src/**/*.js',
];

const bundle = vendor.concat(core);

const test = [
  'node_modules/three/three.js',
].concat(bundle).concat([
  'test/**/*.spec.js',
]);

gulp.task('browserify', function () {
  const b = browserify({
    debug: false,
    //detectGlobals: false,
    //bare: true,
    entries: 'src/index.js'
  });
  return b.bundle()
    .pipe(vSource('index.js'))
    .pipe(gulp.dest('./.tmp/'));
});

gulp.task('css', function () {
  return gulp.src(css)
    .pipe(concat(builds.css))
    .pipe(gulp.dest('./'));
});

gulp.task('core', function () {
  return gulp.src(core)
    .pipe(concat(builds.core))
    .pipe(gulp.dest('./'));
});

gulp.task('bundle', function () {
  return gulp.src(bundle)
    .pipe(concat(builds.bundle))
    .pipe(gulp.dest('./'));
});

gulp.task('uglify', function () {
  return gulp.src(products)
    .pipe(uglify())
    .pipe(rename({
      extname: ".min.js"
    }))
    .pipe(gulp.dest('build'));
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

gulp.task('build', gulp.series('browserify', ['css', 'core', 'bundle']));

gulp.task('default', gulp.series('build', 'uglify'));

gulp.task('test', gulp.series('build', 'karma'));

gulp.task('watch-build', gulp.series('build', 'watch-build-watch'));

gulp.task('watch', gulp.series('watch-build', 'watch-karma'));
