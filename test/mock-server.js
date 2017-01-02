const Websocket = require('ws')
const chai = require('chai')
const expect = chai.expect

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
		expect(message).to.contain.all.keys('id', 'type')
		const handlers = {
			ping: mock.handlePing,
			subscribe: mock.handleSubscribe
		}
		
		handlers[message.type](socket, message)
	},
	handlePing (socket, message) {
		
		const response =  {
			type: 'pong',
			id: message.id
		}
		socket.send(JSON.stringify(response))
	},
	handleSubscribe (socket, message) {
		expect(message).to.contain.all.keys('auth_jwt', 'data')
		const response = {
			type: 'subscribe',
			id: message.id
		}
		if (!mock.checkAuth(message)) {
			response.error = "ACCESS_DENIED"
		} else {
			response.success = true
		}
		
		socket.send(JSON.stringify(response))
	},
	checkAuth (message) {
		return message.auth_jwt === 'hunter2'
	}
}

module.exports = mock
