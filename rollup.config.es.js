import babel from 'rollup-plugin-babel'

export default {
	input: 'src/index.js',
	output: {
		file: 'dist/rohrpost.es.js',
		format: 'es',
	},
	entry: 'src/index.js',
	plugins: [
		babel({
			externalHelpers: true
		})
	],
	external: ['events']
}
