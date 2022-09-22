/* global describe, before, after, it */

const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const expect = chai.expect
chai.use(sinonChai)

const server = require('./mock-server')
const RohrpostClient = require('../dist/rohrpost.js')

const PORT = 9436
const WS_URL = 'ws://localhost:9436'
// const WS_URL = 'wss://api-stage.ax-semantics.com/ws/rohrpost/'
let client = null
describe('Rohrpost Client', () => {
	before(function (done) {
		server.init({
			port: PORT
		}, done)
	})

	after(function () {
		server.destroy()
	})

	it('should connect', (done) => {
		client = new RohrpostClient(WS_URL, {pingInterval: 300, token: 'hunter2'})
		client.once('open', done)
		client.on('error', (error) => {
			throw new Error(error) // let us hear the screams
		})
	})
	it('should ping', (done) => {
		let counter = 0
		const count = () => {
			client.once('pong', () => {
				counter++
				if (counter >= 3) done()
				else count()
			})
		}
		count()
	}).timeout(1500)
	it('should subscribe', (done) => {
		client.subscribe({type: 'collection', id: 52}).then((response) => {
			expect(response.group).to.equal('collection-52')
			done()
		})
	})
	it('should reject bad subscription', (done) => {
		client.subscribe({type: 'INVALID'})
			.then(() => { done('should reject') })
			.catch(() => { done() })
	})
	it('should receive events', (done) => {
		client.once('collection-52', (err, data) => {
			expect(data.type).to.equal('update')
			expect(data.object).to.equal('obj')
			done()
		})
		server.publish({
			type: 'update',
			group: 'collection-52',
			object: 'obj'
		})
	})
	it('should handle custom calls', (done) => {
		client.call('my-little-incrementer', {number: 4}).then((response) => {
			expect(response.number).to.equal(5)
			done()
		}).catch(() => { done('should not error') })
	})
	it('should handle custom call timeouts', (done) => {
		client.call('my-little-timeouter', {number: 4}, {timeout: 500}).then(() => {
			done('should not resolve')
		}).catch(() => { done() })
	})
	it('should detect timeouts', (done) => {
		client.once('closed', done)
		server.drop = true
	})
	it('… and reconnect', (done) => {
		client.once('open', done)
		server.drop = false
	}).timeout(5000)
	it('should automatically resubscribe', (done) => {
		// TODO test this for real
		client.once('collection-52', (err, data) => {
			done()
		})
		server.publish({
			type: 'update',
			group: 'collection-52',
		})
	})
	it('should unsubscribe', (done) => {
		client.unsubscribe({type: 'collection', id: 52}).then(done)
	})
	it('should close when server closes', (done) => {
		server.killAll()
		client.once('closed', done)
	})
	it('… and reconnect', (done) => {
		client.once('open', done)
	}).timeout(5000)
	it('should close itself', (done) => {
		client.close()
		client.once('closed', done)
	})
	it('should error on unknown message type', (done) => {
		client = new RohrpostClient(WS_URL, {pingInterval: 50000, token: 'hunter2'})
		client.once('open', () => server.sendTrashMessageType())
		client.once('error', () => client.close())
		client.once('closed', done)
	})
	it('should error on unknown message id', (done) => {
		client = new RohrpostClient(WS_URL, {pingInterval: 50000, token: 'hunter2'})
		client.once('open', () => server.sendTrashUpdateId())
		client.once('error', () => client.close())
		client.once('closed', done)
	})
	it('should unsubscribe when offline', (done) => {
		server.killAll()
		client.unsubscribe({type: 'collection', id: 52}).then(done)
	})
	it('should not send overlapping pings', (done) => {
		server.messages = []
		server.drop = true
		client = new RohrpostClient(WS_URL, {pingInterval: 100, token: 'hunter2'})
		client.on('error', (error) => expect(error).to.equal('no saved request with id: TRASH'))
		// Send messages to keep client happy, even though we withhold the pong
		setTimeout(server.sendTrashMessageType, 50)
		setTimeout(server.sendTrashMessageType, 150)
		setTimeout(() => {
			// Client has not sent more pings
			expect(server.messages).to.have.length(1)
			expect(server.messages[0].type).to.equal('ping')
			expect(client.socketState).to.equal('open')
			server.sendToAll({type: 'pong', id: 1})
		}, 250)
		setTimeout(() => {
			// Client resumes pinging after pong received
			expect(server.messages).to.have.length(2)
			expect(server.messages[1].type).to.equal('ping')
			expect(client.socketState).to.equal('open')
			// check it actually does time out
			client.once('closed', () => {
				client.close()
				done()
			})
		}, 350)
	})
})
