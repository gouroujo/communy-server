const mu = require('mu2');
const juice = require('juice');
const { readFileSync } = require('fs');
const { sign } = require('jsonwebtoken');

const config = require('./config.json');
const extraCss = readFileSync(__dirname + '/emails/styles.css', { encoding: 'utf8'});

const htmlTemplates = {
  confirm: 'confirm_email.html',
  reset: 'reset_password.html',
  invite: 'invite.html',
}
const textTemplates = {
  confirm: 'confirm_email.txt',
  reset: 'reset_password.txt',
  invite: 'invite.txt',
}
const subjectTemplates = {
  confirm: 'Confirmez votre email',
  reset: 'Mot de passe perdu',
  invite: 'Invitation à rejoindre {{organisation.title}}'
}
mu.root = __dirname + '/emails';

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

function compileSubject(subject, data) {
  return new Promise((resolve, reject) => {
    let email = '';
    mu.renderText(subject, data)
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
    compileEmail(textTemplates[key], data),
    compileSubject(subjectTemplates[key], data)
  ]).then(([htmlPlain, text, subject ]) => {
    return {
      text: text,
      html: juice(htmlPlain, { extraCss }),
      subject: subject
    }
  })
}

module.exports = function (payload) {
  return Promise.resolve()
    .then(() => {
      return sign(payload.token,
        config.SECRET,
        { subject: payload.subject, expiresIn: payload.expiresIn }
      );
    })
    .then(token => {
      return getEmail(payload.subject, Object.assign({}, payload, {
          link: `${config.HOST}/${payload.subject}?t=${token}`,
          sitename: config.SITENAME
        })
      );
    })
}
