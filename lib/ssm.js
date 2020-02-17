'use strict'

const {
    aws
} = require('../config')

const get = async (name) => {
    const sm = aws.systemManagerFactory()
    return new Promise((resolve, reject) => {
        sm.getParameter({
            Name: name,
        }, (err, res) => {
            if (err){
                return reject(err)
            }
            resolve(res.Parameter.Value)
        })
    })
}

const list = async (rootPath) => {
    const sm = aws.systemManagerFactory()
    return new Promise((resolve, reject) => {
        sm.getParametersByPath({
            Path: rootPath,
            Recursive: true,
            // BE WARNED: THIS DOES NOT WORK FOR MORE THAN 10 PARAMETER
            // TODO: provide a NextToken, recurse
        }, (err, data) => {
            if (err){
                return reject(err)
            }
            resolve(data.Parameters)
        })
    })
}


module.exports = {
    get,
    list
}
