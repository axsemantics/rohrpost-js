const EventEmitter = require('events')
const Websocket = require('ws')

module.exports = class RohrpostClient extends EventEmitter {
	constructor (url, config) {
		super()
		const defaultConfig = {
			pingInterval: 5000
		}
		this.config = Object.assign(defaultConfig, config)
		this._socket = new Websocket(url)
		this._socket.addEventListener('open', () => {
			this.emit('open')
			// start pinging
			this.ping()
		})

		this._socket.addEventListener('message', this.processMessage.bind(this))
	}
	
	ping () {
		this.emit('ping')
		const payload = {
			type: 'ping',
			id: 1
		}
		this._socket.send(JSON.stringify(payload))
	}
	
	processMessage (message) {
		this.emit('message', message.data)
		const data = JSON.parse(message.data)
		const typeHandlers = {
			pong: this.handlePong.bind(this)
		}
		
		typeHandlers[data.type](message, data)
	}
	
	handlePong (message, data) {
		this.emit('pong')
		setTimeout(this.ping.bind(this), this.config.pingInterval)
	}
	
}
