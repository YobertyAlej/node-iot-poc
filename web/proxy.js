'use strict'

const chalk = require('chalk')
const debug = require('debug')('iot:web:proxy')
const express = require('express')
const request = require('request-promise-native')
const asyncify = require('express-asyncify')

const app = asyncify(express.Router())

const { endpoint, apiToken } = require('./config')

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

app.get('/agents', async (req, res, next) => {
  const options = {
    method: 'GET',
    url: `${endpoint}/api/agents`,
    headers: {
      'Authorization': `Bearer ${apiToken}`
    },
    json: true
  }

  let result
  try {
    result = await request(options)
  } catch (e) {
    next(e)
  }

  res.send(result)
})

app.get('/agent:uuid', async (req, res, next) => {
  const options = {
    method: 'GET',
    url: `${endpoint}/api/agents`,
    headers: {
      'Authorization': `Bearer ${apiToken}`
    },
    json: true
  }

  let result
  try {
    result = await request(options)
  } catch (e) {
    next(e)
  }

  res.send(result)
})

app.get('/metrics/:uuid', async (req, res, next) => {
  const options = {
    method: 'GET',
    url: `${endpoint}/api/metrics/${req.params.uuid}`,
    headers: {
      'Authorization': `Bearer ${apiToken}`
    },
    json: true
  }

  let result
  try {
    result = await request(options)
  } catch (e) {
    next(e)
  }

  res.send(result)
})

app.get('/metrics/:uuid/:type', async (req, res, next) => {
  const options = {
    method: 'GET',
    url: `${endpoint}/api/metrics/${req.params.uuid}/${req.params.type}`,
    headers: {
      'Authorization': `Bearer ${apiToken}`
    },
    json: true
  }

  let result
  try {
    result = await request(options)
  } catch (e) {
    next(e)
  }

  res.send(result)
})

process.on('uncaughtException', handleFatalError)
process.on('unhandledRejection', handleFatalError)

module.exports = app
