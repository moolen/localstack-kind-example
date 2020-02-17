#!/usr/bin/env node

'use strict'

const winston = require('winston')
const ControlLoop = require('../lib/control-loop')
const ssm = require('../lib/ssm.js')

const {
  loglevel,
  rootPath,
  syncInterval,
  kubeClient,
  namespace
} = require('../config')

async function main () {
  await kubeClient.loadSpec()
  const logger = winston.createLogger({
    level: loglevel,
    defaultMeta: { service: 'localstack-app' },
    transports: [
      new winston.transports.Console()
    ]
  })
  const loop = new ControlLoop({
    logger,
    syncInterval,
    rootPath,
    kubeClient,
    namespace,
    ssm,
  })
  loop.run()
}

main()
