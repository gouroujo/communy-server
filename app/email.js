const mu = require('mu2');
const juice = require('juice');
const { readFileSync } = require('fs');
const { SITENAME } = require('./config');

const extraCss = readFileSync(__dirname + '/templates/emails/styles.css', { encoding: 'utf8'});

const htmlTemplates = {
  EMAIL_CONFIRM: 'emails/confirm_email.html',
  PASSWORD_RESET: 'emails/reset_password.html',
}
const textTemplates = {
  EMAIL_CONFIRM: 'emails/confirm_email.txt'
  PASSWORD_RESET: 'emails/reset_password.txt',
}
mu.root = __dirname + '/templates';

function compileEmail(filename, data) {
  return new Promise((resolve, reject) => {
    let email = '';
    mu.compileAndRender(filename, data)
    .on('data', function (data) {
      email = email + data.toString();
    })
    .on('end', function () {
      resolve(email);
    })
    .on('error', reject);
  })
}

function getEmail(key, data) {
  return Promise.all([
    compileEmail(htmlTemplates[key], data),
    compileEmail(textTemplates[key], data)
  ]).then(([htmlPlain, text]) => {
      return juice(htmlPlain, { extraCss })
        .then(html => ({ html, text }))
    })
}

// const token = user.getPublicToken({ expiresIn: '24h', subject: 'rst_psw' });

module.exports = {
  getConfirmEmail({ user }) {
    return user.getPublicToken({ subject: 'cfm_email' })
    .then(token => {
      return getEmail('EMAIL_CONFIRM', {
        user,
        link: `https://${HOSTNAME}/confirm_email?t=${token}`,
        sitename: SITENAME,
      });
    })
  },

  getResetEmail({ user }) {
    return user.getPublicToken({ subject: 'rst_psw', expiresIn: '24h' })
    .then(token => {
      return getEmail('PASSWORD_RESET', {
        user,
        link: `https://${HOSTNAME}/reset_password?t=${token}`,
        sitename: SITENAME,
      });
    })
  }
}
