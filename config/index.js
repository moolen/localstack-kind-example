'use strict'

const aws = require('./aws-config')
const kube = require('kubernetes-client')
const KubeRequest = require('kubernetes-client/backends/request')

// env
const rootPath = process.env.SSM_PARAMETER_PATH || '/param'
const loglevel = process.env.LOGLEVEL || 'debug'
const syncInterval = process.env.SYNC_INTERVAL || 10000
const namespace = process.env.TARGET_NAMESPACE || 'default'

// k8s
const kubeconfig = new kube.KubeConfig()
kubeconfig.loadFromDefault()
const kubeBackend = new KubeRequest({ kubeconfig })
const kubeClient = new kube.Client({ backend: kubeBackend })

module.exports = {
  aws,
  rootPath,
  loglevel,
  syncInterval,
  namespace,
  kubeClient
}
