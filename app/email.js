const mu = require('mu2');
const juice = require('juice');
const { readFileSync } = require('fs');

const extraCss = readFileSync(__dirname + '/templates/emails/styles.css', { encoding: 'utf8'});

const templates = {
  EMAIL_CONFIRM: 'emails/confirm_email.html'
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

module.exports = {
  getConfirmEmail(user) {
    return compileEmail(templates.EMAIL_CONFIRM, {
      user
    })
      .then(html => {
        return juice(html, { extraCss })
      })
  }
}
