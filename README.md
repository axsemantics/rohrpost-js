# Rohrpost JS

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
