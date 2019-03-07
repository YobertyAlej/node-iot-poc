'use strict'

const BaseService = require('./BaseService')

class AgentService extends BaseService {
  constructor (AgentModel) {
    super(AgentModel)
    this.AgentModel = AgentModel
  }
}

module.exports = AgentService
