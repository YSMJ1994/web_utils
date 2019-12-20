const fs = require('fs-extra');
const path = require('path');
const { src, dest, series } = require('gulp');
const { path2GulpPath } = require('./utils');
const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json', {
	target: 'es5',
	module: 'commonjs',
	declaration: false,
	noEmit: false,
	isolatedModules: false,
	allowJs: false
});

const root = path.resolve(process.cwd(), 'src');
const outDest = path2GulpPath(path.resolve(process.cwd(), 'lib'));
const ignore = [];

async function clean() {
	fs.ensureDirSync(outDest);
	await fs.emptyDir(outDest);
}

async function resolveLib() {
	const stream = src([`${root}/**/*.ts`, `${root}/**/*.tsx`, ...ignore]).pipe(tsProject());
	await stream.js.pipe(dest(outDest));
	// await stream.dts.pipe(dest(outDest));
}

function resolveOthers() {
	return src([`${root}/**/*`, `!${root}/**/*.ts`, `!${root}/**/*.tsx`, ...ignore]).pipe(dest(outDest));
}

module.exports = series(clean, resolveLib, resolveOthers);
