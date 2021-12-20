import babel from '@rollup/plugin-babel'

export default {
	input: 'src/index.js',
	output: {
		file: 'dist/rohrpost.browser.js',
		format: 'cjs',
		exports: 'default'
	},
	plugins: [
		babel({
			babelHelpers: 'external'
		})
	],
	external: ['events']
}
