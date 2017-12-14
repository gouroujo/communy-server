const kue = require('kue');
const queue = require('utils/queue');
const logger = require('logger')

queue.process('email', 5, require('tasks/email'))

queue.on('job complete', (id) => {
  kue.Job.get(id, (err, job) => {
    if (err) return;
    job.remove((err) => {
      if (err) throw err;
      logger.info('removed completed job #%d', job.id);
    });
  });
});

kue.app.set('title', 'Communy - Worker');
kue.app.listen(process.env.PORT || 8000);

process.once('SIGTERM', function () {
  queue.shutdown( 5000, function(err) {
    logger.info(`Kue shutdown: ${err}`);
    process.exit( 0 );
  });
});
