'use strict'

const debug = require('debug')('iot:web')
const chalk = require('chalk')
const http = require('http')
const path = require('path')
const express = require('express')
const socketio = require('socket.io')
const Agent = require('agent')
const asyncify = require('express-asyncify')

const proxy = require('./proxy')
const { pipe } = require('./utils')

const port = process.env.PORT || 8080
const app = asyncify(express())
const server = http.createServer(app)
const io = socketio(server)
const agent = new Agent()

app.use(express.static(path.join(__dirname, 'public')))
app.use('/', proxy)

// Socket.io / Websockets
io.on('connect', socket => {
  debug(`Connected ${socket.id}`)

  pipe(agent, socket)

  socket.on('agent/message', payload => {
    console.log(payload)
  })
})

function handleFatalError (err) {
  console.error(`${chalk.red('[fatal error]')} ${err.message}`)
  console.error(`${chalk.yellow('[stack trace]')} ${err.stack}`)
  process.exit(1)
}
process.on('uncaughtException', handleFatalError)
process.on('unhandledRejection', handleFatalError)

server.listen(port, () => {
  console.log(`${chalk.green('[iot web]')} server is listening on port ${port}`)
  agent.connect()
})
