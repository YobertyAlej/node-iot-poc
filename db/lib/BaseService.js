'use strict'

class ModelService {
  constructor (Model) {
    this.Model = Model
  }

  byId (id) {
    return this.Model.findById(id)
  }

  byUuid (uuid) {
    return this.Model.findOne({
      where: {
        uuid
      }
    })
  }

  async all () {
    return this.Model.findAll()
  }

  async createOrUpdate (instance) {
    const cond = {
      where: {
        uuid: instance.uuid
      }
    }

    const existingModel = await this.Model.findOne(cond)

    if (existingModel) {
      const updated = await this.Model.update(instance, cond)
      return updated ? this.Model.findOne(cond) : existingModel
    }

    const result = await this.Model.create(instance)
    return result.toJSON()
  }

  connected () {
    return this.Model.findAll({
      where: {
        connected: true
      }
    })
  }

  byUsername (username) {
    return this.Model.findAll({
      where: {
        username,
        connected: true
      }
    })
  }

  byProp (prop, value) {
    return this.Model.findAll({
      where: {
        [prop]: value,
        connected: true
      }
    })
  }
}

module.exports = ModelService
