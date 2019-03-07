'use strict'

const debug = require('debug')('iot:api:config')

module.exports = {
  db: {
    database: process.env.DB_NAME || 'iot',
    username: process.env.DB_USER || 'exodus',
    password: process.env.DB_PASS || 'exodus',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: s => debug(s)
  },
  auth: {
    secret: process.env.SECRET || 'exodus'
  }
}
