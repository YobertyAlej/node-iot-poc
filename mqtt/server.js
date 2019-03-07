'use strict'

const debug = require('debug')('iot:mqtt')
const mosca = require('mosca')
const redis = require('redis')
const chalk = require('chalk')
const db = require('db')

const { parsePayload } = require('./utils')

const config = {
  database: process.env.DB_NAME || 'iot',
  username: process.env.DB_USER || 'exodus',
  password: process.env.DB_PASS || 'exodus',
  host: process.env.DB_HOST || 'localhost',
  dialect: 'postgres',
  setup: true,
  logging: s => debug(s)
}

let Agent = null
let Metric = null

const backend = {
  type: 'redis',
  redis,
  return_buffers: true
}

const settings = {
  port: 1883,
  backend
}

const server = new mosca.Server(settings)
const clients = new Map()

server.on('ready', async () => {
  const services = await db(config).catch(handleFatalError)

  Agent = services.Agent
  Metric = services.Metric

  console.log(`${chalk.green('[mqtt]')} server is running`)
})

server.on('clientConnected', client => {
  debug(`Client connected: ${client.id}`)
  clients.set(client.id, null)
})

server.on('clientDisconnected', async client => {
  debug(`Client disconnected: ${client.id}`)
  const agent = clients.get(client.id)

  if (agent) {
    // Set client as discconected
    agent.connected = false

    try {
      await Agent.createOrUpdate(agent)
    } catch (e) {
      return handleError(e)
    }

    // Delete client from Clients list
    clients.delete(client.id)

    server.publish({
      topic: 'agent/disconnected',
      payload: JSON.stringify({
        agent: {
          uuid: agent.uuid
        }
      })
    })

    debug(`Client (${client.id}) associated to Agent (${agent.uuid}) marked as disconnected`)
  }
})

server.on('published', async (packet, client) => {
  debug(`Received: ${packet.topic}`)
  switch (packet.topic) {
    case 'agent/connected':
    case 'agent/disconnected':
      debug(`Payload: ${chalk.yellow(packet.payload)}`)
      break
    case 'agent/message':
      debug(`Payload: ${chalk.yellow(packet.payload)}`)
      const payload = parsePayload(packet.payload)
      if (payload) {
        payload.agent.connected = true

        let agent
        try {
          agent = await Agent.createOrUpdate(payload.agent)
        } catch (e) {
          return handleError(e)
        }
        debug(`Agent ${agent.uuid} saved`)

        // Notify Agent is connected
        if (!clients.get(client.id)) {
          clients.set(client.id, agent)
          server.publish({
            topic: 'agent/connected',
            payload: JSON.stringify({
              agent: {
                uuid: agent.uuid,
                name: agent.name,
                hostname: agent.hostname,
                pid: agent.pid,
                connected: agent.connected
              }
            })
          })
        }

        // Store Metrics

        try {
          await Promise.all(payload.metrics.map(metric => Metric.create(agent.uuid, metric))).then(values => debug('Records saved', values))
        } catch (e) {
          return handleError(e)
        }
      }
      break
  }
})

server.on('error', handleFatalError)
server.on('uncaughtException', handleFatalError)
server.on('unhandledRejection', handleFatalError)

function handleFatalError (err) {
  console.error(`${chalk.red('[fatal error]')} ${err.message}`)
  console.error(`${chalk.yellow('[stack trace]')} ${err.stack}`)
  process.exit(1)
}

function handleError (err) {
  console.error(`${chalk.red('[error]')} ${err.message}`)
  console.error(`${chalk.yellow('[stack trace]')} ${err.stack}`)
}
