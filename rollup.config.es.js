import babel from 'rollup-plugin-babel'

export default {
	entry: 'index.js',
	format: 'es',
	plugins: [babel()],
	dest: 'dist/rohrpost.es.js',
	external: ['events']
}
