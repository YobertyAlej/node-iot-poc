'use strict'

const http = require('http')
const debug = require('debug')('iot:api')
const chalk = require('chalk')
const express = require('express')
const asyncify = require('express-asyncify')

const agents = require('./api/agents')
const metrics = require('./api/metrics')
const auth = require('./api/auth')

const port = process.env.PORT || 3000
const app = asyncify(express())
const server = http.createServer(app)

app.use('/api/agents', agents)
app.use('/api/metrics', metrics)
app.use('/api/auth', auth)

// Express Error Handler
app.use((err, req, res, next) => {
  debug(`Error: ${err.message}`)

  if (err.message.match(/not found/)) {
    return res.status(404).send({ error: err.message })
  }

  if (err.name === 'UnauthorizedError' && err.message === 'Permission denied') {
    return res.status(403).send({ error: err.message })
  }
  if (err.name === 'UnauthorizedError') {
    return res.status(401).send({ error: err.message })
  }

  res.status(500).send({
    error: err.message
  })
})

function handleFatalError (err) {
  console.error(`${chalk.red('[fatal error]')} ${err.message}`)
  console.error(`${chalk.yellow('[stack trace]')} ${err.stack}`)
  process.exit(1)
}

if (!module.parent) {
  process.on('uncaughtException', handleFatalError)
  process.on('unhandledRejection', handleFatalError)

  server.listen(port, () => {
    console.log(`${chalk.green('[iot-api]')} server listening on port ${port}`)
  })
}

module.exports = server
