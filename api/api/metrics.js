'use strict'

const debug = require('debug')('iot:api:routes')
const express = require('express')
const auth = require('express-jwt')
const guard = require('express-jwt-permissions')()
const asyncify = require('express-asyncify')
const db = require('db')

const { MetricsNotFoundError } = require('../api-errors')

const config = require('../config')

const router = asyncify(express.Router())

let services
let Metric

router.use('*', async (req, res, next) => {
  if (!services) {
    debug('Connecting to database')
    try {
      services = await db(config.db)
    } catch (err) {
      return next(err)
    }

    Metric = services.Metric
  }
  next()
})

router.get('/:uuid', auth(config.auth), guard.check([ 'metrics:read' ]), async (req, res, next) => {
  const { uuid } = req.params
  debug(`request to /metrics/${uuid}`)

  let metrics = []
  try {
    metrics = await Metric.findByAgentUuid(uuid)
  } catch (err) {
    return next(err)
  }

  if (!metrics || metrics.length === 0) {
    return next(new MetricsNotFoundError(uuid))
  }
  res.send(metrics)
})

router.get('/:uuid/:type', auth(config.auth), guard.check([ 'metrics:read' ]), async (req, res, next) => {
  const { uuid, type } = req.params
  debug(`request to /metrics/${uuid}/${type}`)

  let metrics = []
  try {
    metrics = await Metric.findByTypeAgentUuid(type, uuid)
  } catch (err) {
    return next(err)
  }

  if (!metrics || metrics.length === 0) {
    return next(new MetricsNotFoundError(uuid, type))
  }
  res.send(metrics)
})

module.exports = router
