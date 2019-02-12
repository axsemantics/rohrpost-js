import babel from 'rollup-plugin-babel'

export default {
	input: 'src/index.js',
	plugins: [
		babel({
			externalHelpers: true
		})
	],
	output: {
		file: 'dist/rohrpost.es.js',
		format: 'es'
	},
	external: ['events']
}
