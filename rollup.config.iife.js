import babel from 'rollup-plugin-babel'
import builtins from 'rollup-plugin-node-builtins'

export default {
	input: 'src/index.js',
	output: {
		name: 'RohrpostClient',
		file: 'dist/rohrpost.iife.js',
		format: 'iife',
	},
	entry: 'src/index.js',
	plugins: [
		babel({
			externalHelpers: true
		}),
		builtins()
	],
}
