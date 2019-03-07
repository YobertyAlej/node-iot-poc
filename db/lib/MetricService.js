'use strict'

class MetricService {
  constructor (MetricModel, AgentModel) {
    this.MetricModel = MetricModel
    this.AgentModel = AgentModel
  }

  async findByAgentUuid (uuid) {
    return this.MetricModel.findAll({
      attributes: ['type'],
      group: ['type'],
      include: [{
        attributes: [],
        model: this.AgentModel,
        where: { uuid }
      }],
      raw: true
    })
  }

  async findByTypeAgentUuid (type, uuid) {
    return this.MetricModel.findAll({
      attributes: [ 'id', 'type', 'value', 'createdAt' ],
      where: { type },
      limit: 20,
      order: [['createdAt', 'DESC']],
      include: [{
        attributes: [],
        model: this.AgentModel,
        where: { uuid }
      }],
      raw: true
    })
  }
  async create (uuid, metric) {
    const agent = await this.AgentModel.findOne({
      where: { uuid }
    })

    if (agent) {
      Object.assign(metric, { agentId: agent.id })
      let result = await this.MetricModel.create(metric)
      return result.toJSON()
    }
  }
}

module.exports = MetricService
