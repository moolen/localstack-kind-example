'use strict'

// taken from godaddy/kubernetes-external-secrets
// Copyright by kubernetes-external-secrets Authors
// License: MIT

/* eslint-disable no-process-env */
const AWS = require('aws-sdk')
const clonedeep = require('lodash.clonedeep')
const merge = require('lodash.merge')

const localstack = process.env.LOCALSTACK || 0

let systemManagerConfig = {}

if (process.env.LOCALSTACK_SSM_URL) {
  systemManagerConfig = {
    endpoint: process.env.LOCALSTACK_SSM_URL,
    region: process.env.AWS_REGION || 'eu-central-1'
  }
}

module.exports = {
  systemManagerFactory: (opts = {}) => {
    if (localstack) {
      opts = merge(clonedeep(opts), systemManagerConfig)
    }
    return new AWS.SSM(opts)
  }
}
