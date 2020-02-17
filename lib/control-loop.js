
const { eachLimit } = require('async')

const sanitize = x => x.replace(/^\//, '').replace(/\//g, "-")

class ControlLoop {

    constructor({
        logger,
        syncInterval,
        rootPath,
        kubeClient,
        ssm,
        namespace
    }) {
        this._logger = logger
        this._syncInterval = syncInterval
        this._ssm = ssm
        this._kubeClient = kubeClient
        this._rootPath = rootPath
        this._namespace = namespace
        this._intervalRef = null
    }

    async _reconcileItem(item) {
        const ns = this._kubeClient.api.v1.namespaces(this._namespace)
        const secretName = "ssm-" + sanitize(item.Name)
        let secretManifest = {
            apiVersion: 'v1',
            kind: 'Secret',
            metadata: {
                name: secretName,
            },
            type: 'Opaque',
            data: {
                value: Buffer.from(item.Value).toString('base64'),
            }
        }
        try {
            return await ns.secrets.post({ body: secretManifest })
        } catch (err) {
            if (err.statusCode !== 409) throw err
            return ns.secrets(secretName).put({ body: secretManifest })
        }
    }

    async reconcile () {
        return new Promise(async (resolve, reject) => {
            this._logger.debug(`listing parameter in ${this._rootPath}`)
            const items = await this._ssm.list(this._rootPath)
            this._logger.debug(`found ${items.length} items`)
            eachLimit(items, 4, async (item) => {
                this._logger.info(`reconciling ${item.Name}`)
                try {
                    await this._reconcileItem(item)
                }catch(e) {
                    this._logger.error(`failed to reconcile: ${e}`)
                }
            }, (err) => {
                if (err) return reject(err)
                resolve()
            })
        })
    }

    run() {
        this._logger.info('starting sync')
        this.reconcile()
        this._intervalRef = setInterval(
            this.reconcile.bind(this),
            this._syncInterval
        )
    }
}

module.exports = ControlLoop
