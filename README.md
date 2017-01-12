# rohrpost-js [![Build Status](https://travis-ci.org/axsemantics/rohrpost-js.svg?branch=master)](https://travis-ci.org/axsemantics/rohrpost-js) [![Coverage Status](https://coveralls.io/repos/github/axsemantics/rohrpost-js/badge.svg?branch=master)](https://coveralls.io/github/axsemantics/rohrpost-js?branch=master) [![npm](https://img.shields.io/npm/v/rohrpost.svg)](https://www.npmjs.com/package/rohrpost)

## Client

### Constructor

```javascript
new RohrpostClient(URL, {pingInterval: 5000, token: $YOUR_JWT})
```

### Subscribe to a group

```javascript
subscribe(groupObject)
```
`groupObject` is defined by the application, for example `{type: 'collection', id: 5}`

returns a Promise, resolves with `groupName` string, use this to listen to events

### Unsubscribe from a group

```javascript
unsubscribe(groupObject)
```

### Listen to events on a group

```javascript
on(groupName, function(err, data))
```

### Example

```javascript
const url = 'wss://api-stage.ax-semantics.com/ws/rohrpost/'
const token = 'ey-jwt'
const colletionId = 23
const client = new new RohrpostClient(url, {token})

client.on('open', () => {
	client.subscribe({type:'collection', id: collectionId}).then((data) => {
		console.log(`subscribed to ${data.group}`)
		client.on(data.group, (err, data) => {
			console.log(`got ${data.type} on ${data.group} : ${JSON.stringify(data.object)}`)
		})
	}).catch((err) => {
		console.error(err)
	})
})

```
