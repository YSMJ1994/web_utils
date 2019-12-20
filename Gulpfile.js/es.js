const fs = require('fs-extra');
const path = require('path');
const { src, dest, series } = require('gulp');
const { path2GulpPath } = require('./utils');
const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json', {
	target: 'esnext',
	module: 'esnext',
	declaration: true,
	noEmit: false,
	isolatedModules: false,
	allowJs: false
});

const root = path.resolve(process.cwd(), 'src');
const outDest = path2GulpPath(path.resolve(process.cwd(), 'es'));
const ignore = [];

async function clean() {
	fs.ensureDirSync(outDest);
	await fs.emptyDir(outDest);
}

async function resolveEs() {
	const stream = src([`${root}/**/*.ts`, `${root}/**/*.tsx`, ...ignore]).pipe(tsProject());
	await stream.js.pipe(dest(outDest));
	await stream.dts.pipe(dest(outDest));
}

function resolveDTS() {
	return src([`${root}/**/*.d.ts`, ...ignore]).pipe(dest(outDest));
}

function resolveOthers() {
	return src([`${root}/**/*`, `!${root}/**/*.ts`, `!${root}/**/*.tsx`, ...ignore]).pipe(dest(outDest));
}

module.exports = series(clean, resolveEs, resolveDTS, resolveOthers);
