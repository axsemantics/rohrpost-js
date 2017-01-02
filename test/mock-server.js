const Websocket = require('ws')

const mock = {
	server: null,
	init (options, cb) {
		mock.server = new Websocket.Server({port: options.port}, cb)
		mock.server.on('connection', (socket) => {
			socket.on('message', mock.handleMessage.bind(this, socket))
		})
	},
	handleMessage (socket, rawMessage) {
		const message = JSON.parse(rawMessage)
		const handlers = {
			ping: mock.handlePing
		}
		
		handlers[message.type](socket, message)
	},
	handlePing (socket, message) {
		const response =  {
			type: 'pong',
			id: message.id
		}
		socket.send(JSON.stringify(response))
	}
}

module.exports = mock
