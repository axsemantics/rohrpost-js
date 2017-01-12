const Websocket = require('ws')
const chai = require('chai')
const expect = chai.expect

const mock = {
	server: null,
	drop: false,
	init (options, cb) {
		mock.server = new Websocket.Server({port: options.port, clientTracking: true}, cb)
		mock.server.on('connection', (socket) => {
			socket.on('message', mock.handleMessage.bind(this, socket))
		})
	},
	killAll () {
		for (let client of mock.server.clients) {
			client.close()
		}
	},
	publish (data) {
		const payload = {
			id: 21,
			type: 'subscription-update',
			data
		}
		mock.sendToAll(payload)
	},
	sendTrashMessageType () {
		const payload = {
			id: 'TRASH',
			type: 'TRASH'
		}
		mock.sendToAll(payload)
	},
	sendTrashUpdateId () {
		const payload = {
			id: 'TRASH',
			type: 'subscribe'
		}
		mock.sendToAll(payload)
	},
	sendToAll (payload) {
		for (let client of mock.server.clients) {
			client.send(JSON.stringify(payload))
		}
	},
	handleMessage (socket, rawMessage) {
		if (mock.drop) return // fall silent
		const message = JSON.parse(rawMessage)
		expect(message).to.contain.all.keys('id', 'type')
		const handlers = {
			ping: mock.handlePing,
			subscribe: mock.handleSubscribe,
			unsubscribe: mock.handleUnsubscribe
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
		if (!mock.checkAuth(message) || message.data.type === 'INVALID') {
			response.error = "ACCESS_DENIED"
		} else {
			response.data = {
				group: 'some-group'
			}
		}
		
		socket.send(JSON.stringify(response))
	},
	handleUnsubscribe (socket, message) { // glorious copypasta
		expect(message).to.contain.all.keys('auth_jwt', 'data')
		const response = {
			type: 'unsubscribe',
			id: message.id
		}
		if (!mock.checkAuth(message) || message.data.type === 'INVALID') {
			response.error = "ACCESS_DENIED"
		}
		
		socket.send(JSON.stringify(response))
	},
	checkAuth (message) {
		return message.auth_jwt === 'hunter2'
	}
}

module.exports = mock
