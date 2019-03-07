# agent

## Usage

``` js

const Agent = require('agent')

const agent = new Agent({
    name: 'iot',
    username: 'admin',
    interval: 2000
})

agent.addMetric('rss', function getRss () {
    return process.memoryUsage().rss
})

agent.addMetric('promiseMetric', function getRandomPromise () {
    return Promise.resolve(Math.random())
})

agent.addMetric('callbackMetric', getRandomCallback(callback){
    setTimeout(()=> {
        callback(null, Math.random())
    }, 1000)
})

agent.connect()

agent.on('connected', handler)
agent.on('disconnected', handler)
agent.on('message', handler)

agent.on('agent/connected', handler)
agent.on('agent/disconnected', handler)
agent.on('agent/message', handler)

function handler (payload) {
  console.log(payload)
}

setTimeout(() => agent.disconnect(), 20000) 

```