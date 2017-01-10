# Rohrpost JS

## Client

### Constructor

```
new RohrpostClient(URL, {pingInterval: 5000, token: $YOUR_JWT})
```

### Subscribe to a group

```
subscribe(groupObject)
```
`groupObject` is defined by the application, for example `{type: 'collection', id: 5}`

returns a `groupName` string, use this to listen to events

### Unsubscribe from a group

```
unsubscribe(groupObject)
```

### Listen to events on a group

```
on(groupName, function(err, data))
```
