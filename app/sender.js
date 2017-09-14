const config = require('./config');
const mailgun = require('mailgun-js')({
  apiKey: config.get('MAILGUN_KEY'),
  domain: config.get('MAILGUN_DOMAIN'),
});

const { models } = require('./db');
const getEmail = require('./email');

/**
 * Background Cloud Function to be triggered by Pub/Sub.
 *
 * @param {object} event The Cloud Functions event.
 * @param {function} callback The callback function.
 */

module.exports = function (event, callback) {
  console.log("RECEIVE DATA FROM PUBSUB")
  const pubsubMessage = event.data;
  const jsonStr = Buffer.from(pubsubMessage.data, 'base64').toString();
  const payload = JSON.parse(jsonStr);

  return Promise.resolve()
    .then(() => {
      if (!payload.subject) {
        throw new Error('Template not provided. Make sure you have a "subject" property in your request');
      }
      if (!payload.userId) {
        throw new Error('userId not provided. Make sure you have a "userId" property in your request');
      }

      return models.User.findById(payload.userId);
    })
    .then(user => {
      if (!user) {
        throw new Error(`User not found. Make sure that userId (${payload.userId}) is correct`);
      }
      if (!user.email) {
        throw new Error(`User ${user._id} don't have an email address`);
      }
      return getEmail(
        payload.subject,
        user,
        payload.body,
        payload.token
      )
    })
    .then(email => {
      return mailgun.messages().send({
        from: `${config.get('SITENAME')}<noreply@${config.get('MAILGUN_DOMAIN')}>`,
        to: user.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
      })
    })
    .then(body => {
      console.log(body)
      callback(body)
    })
};
