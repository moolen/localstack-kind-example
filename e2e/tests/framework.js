'use strict'

const {
  kubeClient
} = require('../../config')

/**
 * generate a uuid for this e2e run
 * taken from https://gist.github.com/6174/6062387
 */
const uuid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

module.exports = {
  uuid,
  waitForSecret: async (name) => {
    return new Promise( async (resolve) => {
      let poll = async () => {
        try {
          return await kubeClient.api.v1.namespaces("default").secrets(name).get()
        }catch(err){
          if (err.statusCode == 404){
            return new Promise(async (rr) => {
              setTimeout(async () => {
                let res = await poll()
                rr(res)
              }, 100)
            })
          }
          throw err
        }
      }
      let res = await poll()
      resolve(res)
    })
  }
}
