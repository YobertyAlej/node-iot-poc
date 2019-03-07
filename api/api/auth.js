'use strict'

const debug = require('debug')('iot:api:routes')
const express = require('express')
const auth = require('express-jwt')
const guard = require('express-jwt-permissions')()
const asyncify = require('express-asyncify')
const db = require('db')

const config = require('../config')

const router = asyncify(express.Router())

router.post('/', async (req, res, next) => {
  debug(`Requesting token in`)
  console.log(req)
  res.send(req)
})

module.exports = router
