// const micromatch = require('micromatch')
module.exports = {
	'src/**/*.{json,css,less,scss,sass}': ['prettier --write', 'git add'],
	'src/**/*.{jsx,ts,tsx,vue}': ['prettier --write', 'git add'],
	'src/**/*!(.min).js': ['prettier --write', 'git add'],
};
