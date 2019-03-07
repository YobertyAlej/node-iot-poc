'use strict'

const test = require('ava')
const request = require('supertest')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const util = require('util')
const config = require('../config')

const agentFixtures = require('./fixtures/agent')
const metricFixtures = require('./fixtures/metric')
const auth = require('../auth')
const sign = util.promisify(auth.sign)

let sandbox = null
let server = null
let dbStub = null
let AgentStub = {}
let MetricStub = {}
let uuid = 'yyy-yyy-yyy'
let type = 'qux'
let token = null
let noPermissionsToken = null
let noSpecifiedPermissionToken = null

test.beforeEach(async () => {
  token = await sign({ admin: true, username: 'exodus', permissions: ['metrics:read', 'agents:read'] }, config.auth.secret)
  // validtoken = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbiI6dHJ1ZSwidXNlcm5hbWUiOiJleG9kdXMiLCJwZXJtaXNzaW9ucyI6WyJtZXRyaWNzOnJlYWQiLCJhZ2VudHM6cmVhZCJdfQ.sYTPx3-c1aVj9NguA9JRuzf1D0fLAWNHFIKfo0Yhtmw

  noPermissionsToken = await sign({ admin: true, username: 'exodus' }, config.auth.secret)

  noSpecifiedPermissionToken = await sign({ admin: true, username: 'exodus', permissions: [] }, config.auth.secret)

  sandbox = sinon.createSandbox()

  AgentStub.connected = sandbox.stub()
  AgentStub.connected.returns(Promise.resolve(agentFixtures.connected))

  AgentStub.all = sandbox.stub()
  AgentStub.all.returns(Promise.resolve(agentFixtures.all))

  AgentStub.byUuid = sandbox.stub()
  AgentStub.byUuid.withArgs(uuid).returns(Promise.resolve(agentFixtures.single))

  MetricStub.findByAgentUuid = sandbox.stub()
  MetricStub.findByAgentUuid.withArgs(uuid).returns(Promise.resolve(metricFixtures.findByAgentUuid(uuid)))

  MetricStub.findByTypeAgentUuid = sandbox.stub()
  MetricStub.findByTypeAgentUuid.withArgs(type, uuid).returns(Promise.resolve(metricFixtures.findByTypeAgentUuid(type, uuid)))

  dbStub = sandbox.stub()
  dbStub.returns(Promise.resolve({
    Agent: AgentStub,
    Metric: MetricStub
  }))

  const agents = proxyquire('../api/agents', {
    'db': dbStub
  })

  const metrics = proxyquire('../api/metrics', {
    'db': dbStub
  })

  server = proxyquire('../server', {
    './api/agents': agents,
    './api/metrics': metrics
  })
})

test.afterEach(async () => {
  sandbox && sandbox.restore()
})

test.serial.cb('api/agents', t => {
  request(server)
    .get('/api/agents')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.falsy(err, 'should not return an error')
      let body = JSON.stringify(res.body)
      let expected = JSON.stringify(agentFixtures.all)
      t.deepEqual(body, expected, 'response body should be the expected')
      t.end()
    })
})

test.serial.cb('api/agents - not authorized - no jwt', t => {
  request(server)
    .get('/api/agents')
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.truthy(err, 'should return an error')
      let status = res.status
      let expectedStatus = 401
      let body = res.body
      let expectedBody = { error: 'No authorization token was found' }
      t.deepEqual(status, expectedStatus, 'response status should be the expected (401)')
      t.deepEqual(body, expectedBody, 'response body should be the expected (no token found)')
      t.end()
    })
})

test.serial.cb('api/agents - not authorized - invalid signature', t => {
  request(server)
    .get('/api/agents')
    .set('Authorization', `Bearer ${token}ERROR`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.truthy(err, 'should return an error')
      let status = res.status
      let expected = 401
      let body = res.body
      let expectedBody = { error: 'invalid signature' }
      t.deepEqual(status, expected, 'response status should be the expected (401)')
      t.deepEqual(body, expectedBody, 'response body should be the expected (invalid token signature)')
      t.end()
    })
})

test.serial.cb('api/agents - not authorized - no permissions token', t => {
  request(server)
    .get('/api/agents')
    .set('Authorization', `Bearer ${noPermissionsToken}`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.truthy(err, 'should return an error')
      let status = res.status
      let expected = 401
      let body = res.body
      let expectedBody = { error: 'Could not find permissions for user. Bad configuration?' }
      t.deepEqual(status, expected, 'response status should be the expected (401)')
      t.deepEqual(body, expectedBody, 'response body should be the expected (no permissions found on token)')
      t.end()
    })
})

test.serial.cb('api/agents - not authorized - no specified permission found on token', t => {
  request(server)
    .get('/api/agents')
    .set('Authorization', `Bearer ${noSpecifiedPermissionToken}`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.truthy(err, 'should return an error')
      let status = res.status
      let expected = 403
      let body = res.body
      let expectedBody = { error: 'Permission denied' }
      t.deepEqual(status, expected, 'response status should be the expected (401)')
      t.deepEqual(body, expectedBody, 'response body should be the expected (no permissions found on token)')
      t.end()
    })
})

test.serial.cb('api/agents/:uuid', t => {
  request(server)
    .get('/api/agents/yyy-yyy-yyy')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.falsy(err, 'should not return an error')
      let body = JSON.stringify(res.body)
      let expected = JSON.stringify(agentFixtures.single)
      t.deepEqual(body, expected, 'response body should be the expected')
      t.end()
    })
})

test.serial.cb('api/agents/:uuid - not found', t => {
  request(server)
    .get('/api/agents/yyy-yyy-yyyERROR')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.truthy(err, 'should return an error')
      let status = res.status
      let expected = 404
      t.deepEqual(status, expected, 'response status should be the expected (404)')
      t.end()
    })
})

test.serial.cb('api/agents/:uuid - not authorized - no jwt', t => {
  request(server)
    .get('/api/agents/yyy-yyy-yyy')
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.truthy(err, 'should return an error')
      let status = res.status
      let expectedStatus = 401
      let body = res.body
      let expectedBody = { error: 'No authorization token was found' }
      t.deepEqual(status, expectedStatus, 'response status should be the expected (401)')
      t.deepEqual(body, expectedBody, 'response body should be the expected (no token found)')
      t.end()
    })
})

test.serial.cb('api/agents/:uuid - not authorized - invalid signature', t => {
  request(server)
    .get('/api/agents/yyy-yyy-yyy')
    .set('Authorization', `Bearer ${token}ERROR`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.truthy(err, 'should return an error')
      let status = res.status
      let expected = 401
      let body = res.body
      let expectedBody = { error: 'invalid signature' }
      t.deepEqual(status, expected, 'response status should be the expected (401)')
      t.deepEqual(body, expectedBody, 'response body should be the expected (invalid token signature)')
      t.end()
    })
})

test.serial.cb('api/agents/:uuid - not authorized - no permissions token', t => {
  request(server)
    .get('/api/agents/yyy-yyy-yyy')
    .set('Authorization', `Bearer ${noPermissionsToken}`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.truthy(err, 'should return an error')
      let status = res.status
      let expected = 401
      let body = res.body
      let expectedBody = { error: 'Could not find permissions for user. Bad configuration?' }
      t.deepEqual(status, expected, 'response status should be the expected (401)')
      t.deepEqual(body, expectedBody, 'response body should be the expected (no permissions found on token)')
      t.end()
    })
})

test.serial.cb('api/agents/:uuid - not authorized - no specified permission found on token', t => {
  request(server)
    .get('/api/agents/yyy-yyy-yyy')
    .set('Authorization', `Bearer ${noSpecifiedPermissionToken}`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.truthy(err, 'should return an error')
      let status = res.status
      let expected = 403
      let body = res.body
      let expectedBody = { error: 'Permission denied' }
      t.deepEqual(status, expected, 'response status should be the expected (401)')
      t.deepEqual(body, expectedBody, 'response body should be the expected (no permissions found on token)')
      t.end()
    })
})

test.serial.cb('api/metrics/:uuid', t => {
  request(server)
    .get('/api/metrics/yyy-yyy-yyy')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .end((err, res) => {
      t.falsy(err, 'should not return an error')
      let body = JSON.stringify(res.body)
      let expected = JSON.stringify(metricFixtures.findByAgentUuid(uuid))
      t.deepEqual(body, expected, 'response body should be the expected')
      t.end()
    })
})

test.serial.cb('api/metrics/:uuid - not authorized - no jwt', t => {
  request(server)
    .get('/api/metrics/yyy-yyy-yyy')
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.truthy(err, 'should return an error')
      let status = res.status
      let expectedStatus = 401
      let body = res.body
      let expectedBody = { error: 'No authorization token was found' }
      t.deepEqual(status, expectedStatus, 'response status should be the expected (401)')
      t.deepEqual(body, expectedBody, 'response body should be the expected (no token found)')
      t.end()
    })
})

test.serial.cb('api/metrics/:uuid - not authorized - invalid signature', t => {
  request(server)
    .get('/api/metrics/yyy-yyy-yyy')
    .set('Authorization', `Bearer ${token}ERROR`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.truthy(err, 'should return an error')
      let status = res.status
      let expected = 401
      let body = res.body
      let expectedBody = { error: 'invalid signature' }
      t.deepEqual(status, expected, 'response status should be the expected (401)')
      t.deepEqual(body, expectedBody, 'response body should be the expected (invalid token signature)')
      t.end()
    })
})

test.serial.cb('api/metrics/:uuid - not authorized - no permissions token', t => {
  request(server)
    .get('/api/metrics/yyy-yyy-yyy')
    .set('Authorization', `Bearer ${noPermissionsToken}`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.truthy(err, 'should return an error')
      let status = res.status
      let expected = 401
      let body = res.body
      let expectedBody = { error: 'Could not find permissions for user. Bad configuration?' }
      t.deepEqual(status, expected, 'response status should be the expected (401)')
      t.deepEqual(body, expectedBody, 'response body should be the expected (no permissions found on token)')
      t.end()
    })
})

test.serial.cb('api/metrics/:uuid - not authorized - no specified permission found on token', t => {
  request(server)
    .get('/api/metrics/yyy-yyy-yyy')
    .set('Authorization', `Bearer ${noSpecifiedPermissionToken}`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.truthy(err, 'should return an error')
      let status = res.status
      let expected = 403
      let body = res.body
      let expectedBody = { error: 'Permission denied' }
      t.deepEqual(status, expected, 'response status should be the expected (401)')
      t.deepEqual(body, expectedBody, 'response body should be the expected (no permissions found on token)')
      t.end()
    })
})

test.serial.cb('api/metrics/:uuid - not found', t => {
  request(server)
    .get('/api/metrics/yyy-yyy-yyyERROR')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.truthy(err, 'should return an error')
      let status = res.status
      let expected = 404
      t.deepEqual(status, expected, 'response status should be the expected (404)')
      t.end()
    })
})

test.serial.cb('api/metrics/:uuid/:type', t => {
  request(server)
    .get('/api/metrics/yyy-yyy-yyy/qux')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .end((err, res) => {
      t.falsy(err, 'should not return an error')
      let body = JSON.stringify(res.body)
      let expected = JSON.stringify(metricFixtures.findByTypeAgentUuid(type, uuid))
      t.deepEqual(body, expected, 'response body should be the expected')
      t.end()
    })
})

test.serial.cb('api/metrics/:uuid/:type - not found', t => {
  request(server)
    .get('/api/metrics/yyy-yyy-yyy/quxERROR')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.truthy(err, 'should return an error')
      let status = res.status
      let expected = 404
      t.deepEqual(status, expected, 'response status should be the expected (404)')
      t.end()
    })
})

test.serial.cb('api/metrics/:uuid/:type - not authorized - no jwt', t => {
  request(server)
    .get('/api/metrics/yyy-yyy-yyy/qux')
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.truthy(err, 'should return an error')
      let status = res.status
      let expectedStatus = 401
      let body = res.body
      let expectedBody = { error: 'No authorization token was found' }
      t.deepEqual(status, expectedStatus, 'response status should be the expected (401)')
      t.deepEqual(body, expectedBody, 'response body should be the expected (no token found)')
      t.end()
    })
})

test.serial.cb('api/metrics/:uuid/:type - not authorized - invalid signature', t => {
  request(server)
    .get('/api/metrics/yyy-yyy-yyy/qux')
    .set('Authorization', `Bearer ${token}ERROR`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.truthy(err, 'should return an error')
      let status = res.status
      let expected = 401
      let body = res.body
      let expectedBody = { error: 'invalid signature' }
      t.deepEqual(status, expected, 'response status should be the expected (401)')
      t.deepEqual(body, expectedBody, 'response body should be the expected (invalid token signature)')
      t.end()
    })
})

test.serial.cb('api/metrics/:uuid/:type - not authorized - no permissions token', t => {
  request(server)
    .get('/api/metrics/yyy-yyy-yyy/qux')
    .set('Authorization', `Bearer ${noPermissionsToken}`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.truthy(err, 'should return an error')
      let status = res.status
      let expected = 401
      let body = res.body
      let expectedBody = { error: 'Could not find permissions for user. Bad configuration?' }
      t.deepEqual(status, expected, 'response status should be the expected (401)')
      t.deepEqual(body, expectedBody, 'response body should be the expected (no permissions found on token)')
      t.end()
    })
})

test.serial.cb('api/metrics/:uuid/:type - not authorized - no specified permission found on token', t => {
  request(server)
    .get('/api/metrics/yyy-yyy-yyy/qux')
    .set('Authorization', `Bearer ${noSpecifiedPermissionToken}`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.truthy(err, 'should return an error')
      let status = res.status
      let expected = 403
      let body = res.body
      let expectedBody = { error: 'Permission denied' }
      t.deepEqual(status, expected, 'response status should be the expected (401)')
      t.deepEqual(body, expectedBody, 'response body should be the expected (no permissions found on token)')
      t.end()
    })
})
