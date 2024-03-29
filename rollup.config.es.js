import babel from 'rollup-plugin-babel'

export default {
	input: 'src/index.js',
	output: {
		file: 'dist/rohrpost.es.js',
		format: 'es',
	},
	plugins: [
		babel({
			externalHelpers: true
		})
	],
	external: ['events']
}
