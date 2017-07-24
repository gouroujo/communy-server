const { PRODUCTION, SITENAME, MAILGUN_CONFIG } = require('../config');
const mailgun = require('mailgun-js')(MAILGUN_CONFIG);

const { models } = require('../db');
const { getConfirmEmail } = require('../email');

module.exports = (data) => new Promise((resolve, reject) => {
  models.User.findById(data.userId).then(user => {
    if(!user) return reject('User not found')

    getConfirmEmail({ user })
    .then(({ html, text}) => {
      mailgun.messages().send({
        from: `Jonathan de ${SITENAME}<j.pollak@mg.orgaa.org>`,
        to: PRODUCTION ? user.email : 'pollak.jonathan+test@gmail.com',
        subject: `${SITENAME} - Confirmez votre email`,
        text,
        html,
      }, function (err, res) {
          if(err) return reject(err)
          resolve(res);
      });
    })
    .catch(reject);
  })
})
