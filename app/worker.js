const kue = require('kue')

const db = require('db')
const queue = require('utils/queue')
const logger = require('logger')
const config = require('config')

queue.process('email', 5, require('tasks/email'))

queue.on('job complete', (id) => {
  kue.Job.get(id, (err, job) => {
    if (err) return;
    job.remove((err) => {
      if (err) throw err;
      logger.info(`removed completed job ${job.id}`, job);
    });
  });
});

kue.app.set('title', 'Communy - Worker');
kue.app.listen(config.get('PORT_WORKER'));

const terminate = () => {
  queue.shutdown( 5000, function(err) {
    logger.info(`Kue shutdown: ${err}`)
    db.mongoose.disconnect(errm => {
      process.exit(errm || err ? 1 : 0);
    })
  });
}
process.once('SIGTERM', terminate);
process.on('SIGINT', terminate);
