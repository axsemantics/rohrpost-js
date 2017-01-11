import babel from 'rollup-plugin-babel'
import inject from 'rollup-plugin-inject'
export default {
	entry: 'index.js',
	format: 'cjs',
	plugins: [babel(), inject({
		include: 'index.js',
		WebSocket: 'ws'
	})],
	dest: 'dist/rohrpost.js',
	external: ['ws', 'events']
}
