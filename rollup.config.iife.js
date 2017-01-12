import babel from 'rollup-plugin-babel'
import builtins from 'rollup-plugin-node-builtins'

export default {
	moduleName: 'RohrpostClient',
	entry: 'src/index.js',
	format: 'iife',
	plugins: [babel(), builtins()],
	dest: 'dist/rohrpost.browser.js'
}
