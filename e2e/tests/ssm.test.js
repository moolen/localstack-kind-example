/* eslint-env mocha */
'use strict'

const util = require('util')
const { expect } = require('chai')

const {
  aws,
} = require('../../config')
const { uuid, waitForSecret } = require('./framework.js')
const { get } = require('../../lib/ssm.js')

const ssm = aws.systemManagerFactory()
const putParameter = util.promisify(ssm.putParameter).bind(ssm)

describe('ssm', async () => {
  it('should pull existing secret from ssm and create a secret from it', async () => {

    await putParameter({
      Name: `/param/test-${uuid}`,
      Type: 'String',
      Value: 'world'
    }).catch(err => {
      expect(err).to.equal(null)
    })

    const res = await get(`/param/test-${uuid}`)
    expect(res).to.equal('world')

    let sec = await waitForSecret(`ssm-param-test-${uuid}`)
    expect(Buffer.from(sec.body.data.value, 'base64').toString('ascii')).to.equal('world')
  })
})
