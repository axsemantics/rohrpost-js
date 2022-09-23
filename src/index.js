/* global WebSocket */
import EventEmitter from 'events'

const defer = function () {
	const deferred = {}
	deferred.promise = new Promise(function (resolve, reject) {
		deferred.resolve = resolve
		deferred.reject = reject
	})
	return deferred
}

export default class RohrpostClient extends EventEmitter {
	constructor (url, config) {
		super()
		const defaultConfig = {
			pingInterval: 5000,
			token: ''
		}
		this._config = Object.assign(defaultConfig, config)
		this._url = url
		this._subscriptions = {}
		this._pendingSubscribes = []
		this._createSocket()
	}

	close () {
		this._normalClose = true
		this._socket.close()
		this._resetPendingRequests('Socket was closed')
	}

	subscribe (group) {
		const { id, promise } = this._createRequest('subscribe', group)
		const payload = {
			type: 'subscribe',
			id,
			auth_jwt: this._config.token,
			data: group
		}
		const send = this._send.bind(this, JSON.stringify(payload))
		if (this.socketState === 'connecting') {
			this.once('open', send)
		} else {
			send()
		}
		return promise
	}

	unsubscribe (group) {
		if (this.socketState !== 'open') {
			// Connection is down anyway, just cancel subscription
			delete this._subscriptions[group]
			return Promise.resolve()
		}
		const { id, promise } = this._createRequest('unsubscribe', group)
		const payload = {
			type: 'unsubscribe',
			id,
			auth_jwt: this._config.token,
			data: group
		}
		this._send(JSON.stringify(payload))
		return promise
	}

	call (name, data, opts) {
		const options = {
			timeout: 2000
		}
		Object.assign(options, opts)

		const { id, promise } = this._createRequest('call')
		const payload = {
			type: name,
			id,
			auth_jwt: this._config.token,
			data
		}
		this._send(JSON.stringify(payload))
		setTimeout(() => {
			if (this._openRequests[id]) {
				const timeoutedRequest = this._popPendingRequest(id)
				timeoutedRequest.deferred.reject(new Error('call timed out'))
			}
		}, options.timeout)
		return promise
	}

	// ===========================================================================
	// INTERNALS
	// ===========================================================================
	_createSocket () {
		this._socket = new WebSocket(this._url)
		this.socketState = 'connecting' // 'closed', 'open', 'connecting'
		this._pingState = {
			latestPong: 0,
			latestMessage: 0,
			pinging: false,
		}
		this.normalClose = false
		this._socket.addEventListener('open', () => {
			this.emit('open')
			this.socketState = 'open'
			// start pinging
			this._ping(this._socket)
			this._resubscribe()
		})

		this._socket.addEventListener('close', (event) => {
			this.socketState = 'closed'
			this.emit('closed') // why past tense? because the socket is already closed and not currently closing
			if (!this._normalClose) {
				this._savePendingSubscribeRequests()
				setTimeout(() => {
					this.emit('reconnecting')
					this._createSocket()
				}, 3000) // throttle reconnect
			}
		})
		this._socket.addEventListener('message', this._processMessage.bind(this))
		this._resetPendingRequests()
	}

	_ping (starterSocket) { // we need a ref to the socket to detect reconnects and stop the old ping loop
		const timestamp = Date.now()
		if (!this._pingState.pinging) {
			const payload = {
				type: 'ping',
				id: timestamp
			}
			this._send(JSON.stringify(payload))
			this.emit('ping')
			this._pingState.pinging = true
		}
		setTimeout(() => {
			if (this._socket.readyState !== 1 || this._socket !== starterSocket) return // looping on old socket, abort
			if (timestamp > this._pingState.latestMessage) // we received no response after the last ping
				this._handlePingTimeout()
			else this._ping(starterSocket)
		}, this._config.pingInterval)
	}

	_handlePingTimeout () {
		this._socket.close()
		this.emit('closed')
	}

	_send (payload) {
		this._socket.send(payload)
		this.emit('log', {
			direction: 'send',
			data: payload
		})
	}

	_processMessage (rawMessage) {
		this._pingState.latestMessage = Date.now()
		const message = JSON.parse(rawMessage.data)
		this.emit('message', message)
		if (message.error) {
			// this.emit('error', message.error)
			const req = this._popPendingRequest(message.id)
			if (!req) return
			req.deferred.reject(message.error)
			return
		}

		const typeHandlers = {
			pong: this._handlePong.bind(this),
			subscribe: this._handleSubscribe.bind(this),
			unsubscribe: this._handleUnsubscribe.bind(this),
			'subscription-update': this._handlePublish.bind(this)
		}

		if (typeHandlers[message.type] === undefined) {
			this._handleGeneric(message)
		} else {
			typeHandlers[message.type](message)
		}
		this.emit('log', {
			direction: 'receive',
			data: rawMessage.data
		})
	}

	_handlePong (message) {
		this.emit('pong')
		this._pingState.pinging = false
		this._pingState.latestPong = Date.now()
	}

	_resubscribe () {
		for (let args of Object.values(this._subscriptions)) {
			this.subscribe(args)
		}
		for (const request of this._pendingSubscribes) {
			this.subscribe(request.args).then(request.deferred.resolve, request.deferred.reject)
		}
		this._pendingSubscribes.splice(0)
	}

	_savePendingSubscribeRequests () {
		const pendingSubscribes = Object.entries(this._openRequests).filter(([id, request]) => request.type === 'subscribe')
		for (const [id, request] of pendingSubscribes) {
			delete this._openRequests[id]
			this._pendingSubscribes.push(request)
		}
	}

	_handleSubscribe (message) {
		const req = this._popPendingRequest(message.id)
		if (!req) return // error already emitted in pop
		if (!this._subscriptions[message.data.group]) this._subscriptions[message.data.group] = req.args
		req.deferred.resolve(message.data)
	}

	_handleUnsubscribe (message) {
		const req = this._popPendingRequest(message.id)
		if (!req) return // error already emitted in pop
		for (let [group, args] of Object.entries(this._subscriptions)) {
			if (args.type === req.args.type && args.id === req.args.id) { // this is perhaps a bit stupid
				delete this._subscriptions[group]
				break
			}
		}
		req.deferred.resolve(message.data)
	}

	_handlePublish (message) {
		this.emit(message.data.group, null, message.data)
	}

	_handleGeneric (message) {
		const req = this._popPendingRequest(message.id)
		if (!req) return // error already emitted in pop
		req.deferred.resolve(message.data)
	}

	// request - response promise matching
	_createRequest (type, args) {
		const id = this._nextRequestIndex++
		const deferred = defer()
		this._openRequests[id] = { type, deferred, args }
		return { id, promise: deferred.promise }
	}

	_popPendingRequest (id) {
		const req = this._openRequests[id]
		if (!req) {
			this.emit('error', `no saved request with id: ${id}`)
		} else {
			delete this._openRequests[id]
			return req
		}
	}

	_resetPendingRequests (reason) {
		if (this._openRequests != null) {
			for (const request of Object.values(this._openRequests)) {
				if (request.type === 'unsubscribe') {
					delete this._subscriptions[request.args]
					request.deferred.resolve()
				} else {
					request.deferred.reject(reason)
				}
			}
		}
		this._openRequests = {} // save deferred promises from requests waiting for reponse
		this._nextRequestIndex = 1 // autoincremented rohrpost message id
	}
}
