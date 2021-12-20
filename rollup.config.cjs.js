import babel from '@rollup/plugin-babel'
import inject from '@rollup/plugin-inject'

export default {
	input: 'src/index.js',
	output: {
		file: 'dist/rohrpost.js',
		format: 'cjs',
		exports: 'default'
	},
	plugins: [
		babel({
			babelHelpers: 'external'
		}),
		inject({
			include: 'src/index.js',
			WebSocket: 'ws'
		})
	],
	external: ['ws', 'events']
}
