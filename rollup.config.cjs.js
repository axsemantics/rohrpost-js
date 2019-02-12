import babel from 'rollup-plugin-babel'
import inject from 'rollup-plugin-inject'
export default {
	input: 'src/index.js',
	plugins: [
		babel({
			externalHelpers: true
		}),
		inject({
			include: 'src/index.js',
			WebSocket: 'ws'
		})
	],
	output: {
		file:'dist/rohrpost.js',
		format: 'cjs'
	},
	external: ['ws', 'events']
}
