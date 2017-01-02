const EventEmitter = require('events')
const Websocket = require('ws')

module.exports = class RohrpostClient extends EventEmitter {
	constructor (url, config) {
		super()
		const defaultConfig = {
			pingInterval: 5000,
			token: ''
		}
		this.config = Object.assign(defaultConfig, config)
		this._socket = new Websocket(url)
		this.pingState = {
			latestPong: 0,
			
		}
		this._socket.addEventListener('open', () => {
			this.emit('open')
			// start pinging
			this.ping()
		})

		this._socket.addEventListener('message', this.processMessage.bind(this))
	}
	
	ping () {
		this.emit('ping')
		const timestamp = Date.now()
		const payload = {
			type: 'ping',
			id: timestamp
		}
		this._socket.send(JSON.stringify(payload))
		setTimeout(() => {
			if (timestamp > this.pingState.latestPong) // we received no pong after the last ping
				this.handleTimeout()
			else this.ping()
		}, this.config.pingInterval)
	}
	
	subscribe(channel) {
		const timestamp = Date.now()
		const payload = {
			type: 'subscribe',
			id: timestamp,
			auth_jwt: this.config.token,
			data: channel
		}
		this._socket.send(JSON.stringify(payload))
	}
	
	processMessage (message) {
		const data = JSON.parse(message.data)
		if(data.error) {
			this.emit(data.error)
			console.error(data.error)
			return
		}
		this.emit('message', data)
		
		const typeHandlers = {
			pong: this.handlePong.bind(this)
		}
		
		typeHandlers[data.type](message, data)
	}
	
	handlePong (message, data) {
		this.emit('pong')
		this.pingState.latestPong = Date.now()
	}
	
	handleTimeout () {
		this._socket.close()
		this.emit('close')
	}
	
}
