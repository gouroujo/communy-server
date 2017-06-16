const { MAILGUN_CONFIG } = require('../config');
const mailgun = require('mailgun-js')(MAILGUN_CONFIG);

const { models } = require('../db');
const { getConfirmEmail } = require('../email');

module.exports = (userId) => new Promise((resolve, reject) => {
  models.User.findById(userId).then(user => {
    if(!user) return reject('User not found')

    getConfirmEmail(user).then(html => {
      console.log(html)
      mailgun.messages().send({
        from: 'Jonathan P. <j.pollak@mg.orgaa.org>',
        to: 'pollak.jonathan@gmail.com',
        subject: 'Orgaa - Confirmez votre email',
        text: 'Testing some Mailgun awesomness!',
        html: html,
      }, function (err, res) {
        if(err) return reject(err)
        resolve(res);
      });
    })
    .catch(reject);
  })
})
