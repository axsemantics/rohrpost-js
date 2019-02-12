import babel from 'rollup-plugin-babel'
import builtins from 'rollup-plugin-node-builtins'

export default {
	input: 'src/index.js',
	plugins: [
		babel({
			externalHelpers: true
		}),
		builtins()
	],
	output: {
		file: 'dist/rohrpost.browser.js',
		format: 'iife',
		name: 'RohrpostClient'
	}
}
