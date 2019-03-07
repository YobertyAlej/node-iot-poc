'use strict'

const chalk = require('chalk')
const db = require('../')

async function run () {
  const config = {
    database: process.env.DB_NAME || 'iot',
    username: process.env.DB_USER || 'exodus',
    password: process.env.DB_PASS || 'exodus',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres'
  }

  const { Agent, Metric } = await db(config).catch(handleFatalError)
  const agent = await Agent.createOrUpdate({
    uuid: '123-123-123',
    username: 'exodus',
    name: 'exodus',
    hostname: 'updated',
    pid: 1,
    connected: true
  }).catch(handleFatalError)

  console.log('--agent--')
  console.log(agent)

  const agents = await Agent.all.catch(handleFatalError)

  console.log('--all agents--')
  console.log(agents)

  const metric = await Metric.create(agent.uuid, {
    type: 'foo',
    value: 20
  })

  console.log('--metric--')
  console.log(metric)

  const metrics = await Metric.findByAgentUuid(agent.uuid).catch(handleFatalError)

  console.log('--metrics--')
  console.log(metrics)

  const metricsByTypeAgent = await Metric.findByTypeAgentUuid('foo', agent.uuid).catch(handleFatalError)

  console.log('--metrics by type (foo)--')
  console.log(metricsByTypeAgent)

  console.log(`${chalk.green('[example-script]')} example finished completly`)
  process.exit(0)
}

function handleFatalError (err) {
  console.error(`\n\n${chalk.red('[fatal error]')} ${err.message}`)
  console.error(`${chalk.yellow('[stack trace]')} ${err.stack} \n\n`)
  process.exit(1)
}

run()
