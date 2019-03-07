# exodus-mqtt

MQTT Server to broadcast the agents metrics into our db using mosca

## Usage

### `agent/connected`

``` js
{
    agent: {
        uuid,
        username,
        name,
        hostname,
        pid
    }
}
```

## `agent/disconnected`

``` js
{
    agent: {
        uuid
    }
}

```

## `agent/message`

``` js
{
    agent,
    metrics: [
        {
            type,
            value
        }
    ],
    timestamp
}

```