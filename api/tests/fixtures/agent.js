'use strict'

const utils = require('../../utils')

const extend = utils.extend

const agent = {
  id: 1,
  uuid: 'yyy-yyy-yyy',
  name: 'fixture',
  username: 'exodus',
  hostname: 'test-host',
  pid: 0,
  connected: true,
  createdAt: new Date(),
  updatedAt: new Date()
}

const agents = [
  agent,
  extend(agent, { id: 2, uuid: 'yyy-yyy-yyw', connected: false, username: 'test' }),
  extend(agent, { id: 3, uuid: 'yyy-yyy-yyx', connected: false }),
  extend(agent, { id: 4, uuid: 'yyy-yyy-yyz', connected: false, username: 'test' })
]

module.exports = {
  single: agent,
  all: agents,
  connected: agents.filter(a => a.connected),
  exodus: agents.filter(a => a.username === 'exodus'),
  byUuid: uuid => agents.filter(a => a.uuid === uuid).shift(),
  byId: id => agents.filter(a => a.id === id).shift()

}
