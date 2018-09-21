import babel from 'rollup-plugin-babel'

export default {
	entry: 'src/index.js',
	format: 'es',
	plugins: [
		babel({
			externalHelpers: true
		})
	],
	dest: 'dist/rohrpost.es.js',
	external: ['events']
}
