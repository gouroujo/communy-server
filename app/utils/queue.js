const kue = require('kue')
const config = require('config')
const logger = require('logger')

const queue = config.get('REDIS_URI') ? kue.createQueue({
  redis: config.get('REDIS_URI')
}) : ({
  create: (name, options) => logger.info(`Kue not configured for queue ${name}. Unable to add the job: `, options),
  process: (name) => logger.info(`Kue not configured. Unable to process queue ${name}.`)
})

if (config.get('REDIS_URI')) {
  queue.on('job enqueue', (id, type) => {
    logger.info(`Job ${id} got queued of type ${type}`);
  })
}

module.exports = queue
