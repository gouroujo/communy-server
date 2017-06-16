const { REDIS_URI, jobs } = require('./config');

const queue = require('kue').createQueue({ redis: REDIS_URI });

process.once('SIGTERM', function ( sig ) {
  queue.shutdown(5000, function(err) {
    console.log( 'Worker shutdown! ', err||'' );
    process.exit( 0 );
  });
});

process.once('SIGUSR2', function () {
  queue.shutdown(5000, function(err) {
    console.log( 'Worker restart! ', err||'' );
    process.kill(process.pid, 'SIGUSR2');
  });
});

queue.process(jobs.SEND_CONFIRM_EMAIL, function(job, done) {
  return require('./tasks/sendEmailConfirmation')(job.data.userId)
    .then((res) => done(null, res))
    .catch((err) => done(new Error(err)))
});
