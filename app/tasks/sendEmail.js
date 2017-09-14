const pubsub = require('../utils/pubsub');
const config = require('../config');

module.exports = function (userId, subject, body, token ) {
  return Promise.resolve()
    .then(() => {
      return JSON.stringify({
        userId,
        subject,
        body,
        token
      })
    })
    .then(data => {
      if (config.get('PUBSUB_TOPIC_EMAIL')) {
        return pubsub.publishMessage(config.get('PUBSUB_TOPIC_EMAIL'), data);
      }
      console.log('No pubsub topic defined to send email. message not send')
      return
    })
}
