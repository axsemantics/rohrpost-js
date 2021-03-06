import babel from 'rollup-plugin-babel'
import builtins from 'rollup-plugin-node-builtins'

export default {
	input: 'src/index.js',
	output: {
		format: 'cjs',
		file: 'dist/rohrpost.browser.js'
	},
	plugins: [babel(), builtins()]
}
