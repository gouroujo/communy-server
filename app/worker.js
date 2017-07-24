const { jobs } = require('./config');
const queue = require('./queue');

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
  return require('./tasks/sendEmailConfirmation')(job.data)
    .then((res) => done(null, res))
    .catch((err) => done(new Error(err)))
});

queue.process(jobs.SEND_RESET_PASSWORD, function(job, done) {
  return require('./tasks/sendResetPassword')(job.data)
    .then((res) => done(null, res))
    .catch((err) => done(new Error(err)))
});
