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
	it('should connect', (done) => {
		client = new RohrpostClient(WS_URL, {pingInterval: 500, token: 'hunter2'})
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
		client.subscribe({type:'collection', id: 52}).then((response) => {
			expect(response.group).to.equal('some-group')
			done()
		})
	})
	it('should reject bad subscription', (done) => {
		client.subscribe({type: 'INVALID'})
			.then(() => { done('should reject') })
			.catch(() => { done() })
	})
	it('should receive events', (done) => {
		client.once('some-group', (err, data) => {
			expect(data.type).to.equal('update')
			expect(data.object).to.equal('obj')
			done()
		})
		server.publish({
			type: 'update',
			group: 'some-group',
			object: 'obj'
		})
	})
	it('should unsubscribe', (done) => {
		client.unsubscribe({type:'collection', id: 52}).then(done)
	})
	it('should detect timeouts', (done) => {
		client.once('closed', done)
		server.drop = true
	})
	it('should close when server closes', (done) => {
		client = new RohrpostClient(WS_URL, {pingInterval: 500, token: 'hunter2'})
		client.once('open', () => server.killAll())
		client.once('closed', done)
	})
	it('should close itself', (done) => {
		client = new RohrpostClient(WS_URL, {pingInterval: 500, token: 'hunter2'})
		client.once('open', () => client.close())
		client.once('closed', done)
	})
	it('should error on unknown message type', (done) => {
		client = new RohrpostClient(WS_URL, {pingInterval: 500, token: 'hunter2'})
		client.once('open', () => server.sendTrashMessageType())
		client.once('error', () => done())
	})
	it('should error on unknown message id', (done) => {
		client.once('error', () => done())
		server.sendTrashUpdateId()
	})
})
