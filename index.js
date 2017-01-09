const EventEmitter = require('events')
const Websocket = require('ws')

const defer = function () {
	const deferred = {}
	deferred.promise = new Promise(function (resolve, reject) {
		deferred.resolve = resolve
		deferred.reject = reject
	})
	return deferred
}

module.exports = class RohrpostClient extends EventEmitter {
	constructor (url, config) {
		super()
		const defaultConfig = {
			pingInterval: 5000,
			token: ''
		}
		this.config = Object.assign(defaultConfig, config)
		this._socket = new Websocket(url)
		this._pingState = {
			latestPong: 0,
			
		}
		this._socket.addEventListener('open', () => {
			this.emit('open')
			// start pinging
			this._ping()
		})
		
		this._socket.addEventListener('close', () => {
			this.emit('closed') // why past tense? because the socket is already closed and not currently closing
		})

		this._socket.addEventListener('message', this._processMessage.bind(this))
		this._openRequests = {} // save deferred promises from requests waiting for reponse
	}
	
	close () {
		this._socket.close()
	}
	
	subscribe (group) {
		const {id, promise} = this._createRequest()
		const payload = {
			type: 'subscribe',
			id,
			auth_jwt: this.config.token,
			data: group
		}
		this._socket.send(JSON.stringify(payload))
		return promise
	}
	
	unsubscribe (group) { // glorious copypasta
		const {id, promise} = this._createRequest()
		const payload = {
			type: 'unsubscribe',
			id,
			auth_jwt: this.config.token,
			data: group
		}
		this._socket.send(JSON.stringify(payload))
		return promise
	}
	
	// ===========================================================================
	// INTERNALS
	// ===========================================================================
	
	_ping () {
		if (this._socket.readyState !== 1) // socket still open?
			return
		const timestamp = Date.now()
		const payload = {
			type: 'ping',
			id: timestamp
		}
		this._socket.send(JSON.stringify(payload))
		this.emit('ping')
		setTimeout(() => {
			if (timestamp > this._pingState.latestPong) // we received no pong after the last ping
				this._handlePingTimeout()
			else this._ping()
		}, this.config.pingInterval)
	}
	
	_handlePingTimeout () {
		this._socket.close()
		this.emit('closed')
	}
	
	_processMessage (rawMessage) {
		const message = JSON.parse(rawMessage.data)
		if(message.error) {
			// this.emit('error', message.error)
			this._popPendingRequest(message.id).reject(message.error)
			return
		}
		this.emit('message', message)
		
		const typeHandlers = {
			pong: this._handlePong.bind(this),
			subscribe: this._handleSubscribe.bind(this),
			unsubscribe: this._handleUnsubscribe.bind(this)
		}
		
		if(typeHandlers[message.type] === undefined) {
			this.emit('error', `incoming message type "${message.type}" not recognized`)
		} else {
			typeHandlers[message.type](message)
		}
		
	}
	
	_handlePong (message) {
		this.emit('pong')
		this._pingState.latestPong = Date.now()
	}
	
	_handleSubscribe (message) {
		this._popPendingRequest(message.id).resolve(message.data)
	}
	
	_handleUnsubscribe (message) {
		this._popPendingRequest(message.id).resolve(message.data)
	}
	
	// request - response promise matching
	_createRequest () {
		const id = Date.now()
		const deferred = defer()
		this._openRequests[id] = deferred
		return {id, promise: deferred.promise}
	}
	
	_popPendingRequest (id) {
		const deferred = this._openRequests[id]
		if(!deferred) {
			this.emit('error', `no saved request with id: ${id}`)
		} else {
			this._openRequests[id] = undefined
			return deferred
		}
	}
}
