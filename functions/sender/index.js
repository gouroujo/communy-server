const config = require('./config.json');
const mailgun = require('mailgun-js')({
  apiKey: config.MAILGUN_KEY,
  domain: config.MAILGUN_DOMAIN,
});

const getEmail = require('./email');

/**
 * Background Cloud Function to be triggered by Pub/Sub.
 *
 * @param {object} event The Cloud Functions event.
 * @param {function} callback The callback function is omited when returning promise.
 */

exports.sender = function (event) {
  const pubsubMessage = event.data;
  const jsonStr = Buffer.from(pubsubMessage.data, 'base64').toString();
  const payload = JSON.parse(jsonStr);
  return Promise.resolve()
    .then(() => {
      if (!payload.subject) {
        throw new Error('Template not provided. Make sure you have a "subject" property in your request');
      }
      if (!payload.user) {
        throw new Error('user object not provided. Make sure you have a "user" property in your request');
      }
      if (!payload.token) {
        throw new Error('token payload not provided. Make sure you have a token payload with at least a user id property in your request');
      }
      if (!payload.token.id) {
        throw new Error('token.id not provided. Make sure you have a "token.id" property in your request');
      }
      if (!payload.user.email) {
        throw new Error('user.email not provided. Make sure you have a "user.email" property in your request');
      }
      if (!payload.user.fullname) {
        console.log('user.fullname not provided. Sending email without a name')
      }
      return getEmail(payload)
      .then(email => {
        return mailgun.messages().send({
          from: `${config.SITENAME}<noreply@${config.MAILGUN_DOMAIN}>`,
          to: payload.user.email,
          subject: email.subject,
          text: email.text,
          html: email.html,
        })
      })
    })
    .then(body => {
      console.log('Email sent !')
      return body
    })
    .catch(e => {
      console.log(e)
      throw new Error(e);
    })
};
