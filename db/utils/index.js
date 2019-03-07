'use strict'

const chalk = require('chalk')

function extend (obj, values) {
  const clone = Object.assign({}, obj)
  return Object.assign(clone, values)
}

function sortBy (property) {
  return (a, b) => {
    let aProp = a[property]
    let bProp = b[property]

    if (aProp < bProp) {
      return -1
    } else if (aProp > bProp) {
      return 1
    } else {
      return 0
    }
  }
}

function handleFatalError (err) {
  console.error(`\n\n${chalk.red('[fatal error]')} ${err.message}`)
  console.error(`${chalk.yellow('[stack trace]')} ${err.stack} \n\n`)
  process.exit(1)
}

module.exports = {
  extend,
  sortBy,
  handleFatalError
}
