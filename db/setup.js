'use strict'

const debug = require('debug')('iot:db:setup')
const inquirer = require('inquirer')
const db = require('./')
const { handleFatalError } = require('./utils')

const prompt = inquirer.createPromptModule()

async function setup () {
  if (process.argv.pop() !== '--y') {
    const answer = await prompt([
      {
        type: 'confirm',
        name: 'setup',
        message: 'This will destroy your db, are you sure?'
      }
    ])

    if (!answer.setup) {
      return console.log('Nothing happened :)')
    }
  }

  const config = {
    database: process.env.DB_NAME || 'iot',
    username: process.env.DB_USER || 'exodus',
    password: process.env.DB_PASS || 'exodus',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    setup: true,
    logging: s => debug(s)
  }

  await db(config).catch(handleFatalError)

  console.log('Success!')
  process.exit(0)
}

setup()
