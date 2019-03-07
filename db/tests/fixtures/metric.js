'use strict'

const agentFixtures = require('./agent')
const utils = require('../../utils')

const extend = utils.extend

const metric = {
  id: 1,
  agentId: 1,
  type: 'foo',
  value: 1,
  createdAt: new Date(),
  agent: agentFixtures.byId(1)
}

const metrics = [
  metric,
  extend(metric, { id: 2, type: 'bar', value: 2 }),
  extend(metric, { id: 3, type: 'baz', value: 3 }),
  extend(metric, { id: 4, agentId: 4, type: 'exodus', value: 4, agent: agentFixtures.byId(4) }),
  extend(metric, { id: 5, type: 'qux', value: 0 })
]

function findByAgentUuid (uuid) {
  return metrics.filter(m => m.agent ? m.agent.uuid === uuid : false).map(m => {
    const clone = Object.assign({}, m)

    delete clone.agent

    return clone
  })
}

function findByTypeAgentUuid (type, uuid) {
  return metrics.filter(m => m.type === type && (m.agent ? m.agent.uuid === uuid : false)).map(m => {
    const clone = Object.assign({}, m)

    delete clone.agentId
    delete clone.agent

    return clone
  }).sort(utils.sortBy('createdAt')).reverse()
}

module.exports = {
  single: metric,
  all: metrics,
  positives: metrics.filter(m => m.value > 0),
  stopped: metrics.filter(m => m.value === 0),
  exodus: metrics.filter(m => m.type === 'exodus').shift(),
  findByAgentUuid,
  findByTypeAgentUuid
}
