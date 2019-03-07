'use strict'

const debug = require('debug')('iot:api:routes')
const express = require('express')
const auth = require('express-jwt')
const guard = require('express-jwt-permissions')()
const asyncify = require('express-asyncify')
const db = require('db')

const {
  AgentNotFoundError,
  NotAuthorizedError
} = require('../api-errors')

const config = require('../config')

const router = asyncify(express.Router())

let services
let Agent

router.use('*', async (req, res, next) => {
  if (!services) {
    debug('Connecting to database')
    try {
      services = await db(config.db)
    } catch (err) {
      return next(err)
    }

    Agent = services.Agent
  }
  next()
})

router.get('/', auth(config.auth), guard.check(['agents:read']), async (req, res, next) => {
  debug('A new request has come to /agents')

  const { user } = req

  if (!user || !user.username) {
    return new NotAuthorizedError()
  }

  let agents = []

  try {
    if (user.admin) {
      agents = await Agent.all()
    } else {
      agents = await Agent.byUsername(user.username)
    }
  } catch (err) {
    return next(err)
  }

  res.send(agents)
})

router.get('/:uuid', auth(config.auth), guard.check(['agents:read']), async (req, res, next) => {
  const { uuid } = req.params
  debug(`request to /agents/${uuid}`)

  let agent
  try {
    agent = await Agent.byUuid(uuid)
  } catch (err) {
    return next(err)
  }

  if (!agent) {
    return next(new AgentNotFoundError(uuid))
  }

  res.send(agent)
})

module.exports = router
