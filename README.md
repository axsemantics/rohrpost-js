# Rohrpost JS

## Client

### Constructor

```
new RohrpostClient(URL, {pingInterval: 5000, token: $YOUR_JWT})
```

### Subscribe to a group

```
subscribe(group)
```

### Unsubscribe from a group

```
unsubscribe(group)
```

### Listen to events on a group

```
on(group, function(err, data))
```
