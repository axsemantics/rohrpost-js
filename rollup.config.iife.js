import babel from '@rollup/plugin-babel'
import node from 'rollup-plugin-polyfill-node'

export default {
	input: 'src/index.js',
	output: {
		name: 'RohrpostClient',
		file: 'dist/rohrpost.iife.js',
		format: 'iife',
	},
	plugins: [
		babel({
			babelHelpers: 'external'
		}),
		node()
	],
}
