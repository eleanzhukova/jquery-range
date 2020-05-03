const gulp = require('gulp'),
  rename = require('gulp-rename'),
  concat = require('gulp-concat'),
  path = require('path');
  
const postcss = require('gulp-postcss'),
  cleanCSS = require('gulp-clean-css');

const uglify = require('gulp-uglify'),
  babel = require('gulp-babel');

const css = {
  dir: './jquery-range/css',
  srcDir: 'src',
  resultDir: '',
  srcFile: 'jquery-range.pcss',
  resultFile: 'jquery-range.min.css',
  cleanOptions: {
    restructuring: true,
    aggressiveMerging: true,
    compatibility: 'ie10+'
  },
  plugins: [
    ['postcss-import'],
    ['postcss-mixins'],
    ['postcss-nested'],
    ['postcss-simple-vars'],
    ['postcss-hexrgba']
  ]
};

const js = {
  dir: './jquery-range/js',
  srcDir: 'src',
  resultDir: '',
  srcFile: 'jquery-range.js',
  resultFile: 'jquery-range.min.js',
  uglifyOptions: {
    compress: {
      pure_funcs: ['console.log']
    }
  }
};

const processors = [];
for (let plugin of css.plugins) {
  let module = plugin.shift(),
    processor = require(module),
    args = plugin;
  processors.push(processor.apply(global, args));
}

gulp.task('build-css', function() {
  return gulp.src(path.join(css.dir, css.srcDir, css.srcFile))
    .pipe(postcss(processors))
    .pipe(cleanCSS(css.cleanOptions))
    .pipe(rename(css.resultFile))
    .pipe(gulp.dest(path.join(css.dir, css.resultDir)));
});

gulp.task('build-js', function() {
  return gulp.src(path.join(js.dir, js.srcDir, js.srcFile))
    .pipe(babel({presets: ['env']}))
    .pipe(concat(js.resultFile))
    .pipe(uglify(js.uglifyOptions))
    .pipe(gulp.dest(path.join(js.dir, js.resultDir)));
});

gulp.task('watch-css', function () {
  let files = [
    path.posix.join(css.dir, css.srcDir, '**', '*.pcss'),
    path.posix.join(css.dir, css.srcDir, '**', '*.css')
  ];
  gulp.watch(files, gulp.parallel('build-css'));
});

gulp.task('watch-js', function () {
  let files = [
    path.posix.join(js.dir, js.srcDir, '**', '*.js')
  ];
  gulp.watch(files, gulp.parallel('build-js'));
});

gulp.task('watch', gulp.parallel('watch-js', 'watch-css'));
gulp.task('build', gulp.parallel('build-js', 'build-css'));
