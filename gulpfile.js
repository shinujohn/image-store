var gulp = require('gulp');
var git = require('gulp-git');
var bump = require('gulp-bump');

gulp.task('bump-minor', function () {

    return gulp.src('./package.json', { cwd: './' })
        .pipe(bump({ type: 'minor' }))
        .pipe(gulp.dest('./'))
        .pipe(git.commit('bumped package version'))
        .pipe(git.push('origin', 'master'))
        .pipe(git.tag('abc', 'abc', { push: true }));
});