const mu = require('mu2')
const juice = require('juice')
const { readFileSync } = require('fs')
const extraCss = readFileSync(__dirname + '/emails/styles.css', { encoding: 'utf8'})

const htmlTemplates = {
  confirm: 'confirm_email.html',
  reset: 'reset_password.html',
  invite: 'invite.html',
  message: 'message.html',
}

const textTemplates = {
  confirm: 'confirm_email.txt',
  reset: 'reset_password.txt',
  invite: 'invite.txt',
  join: 'join.txt',
  message: 'message.txt',
}

const subjectTemplates = {
  confirm: 'Confirmez votre email',
  reset: 'Mot de passe perdu',
  invite: 'Souhaitez-vous rejoindre {{organisation.title}} ?',
  join: 'Gérez {{organisation.title}} plus facilement',
  message: 'Nouveau message de {{organisation.title}}',
}

mu.root = __dirname + '/emails';

function compileEmail(filename, data) {
  if (filename === null) return Promise.resolve(null)
  if (!filename) throw new Error('no filename specified')

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
  if (subject === null) return Promise.resolve(null)
  if (!subject) throw new Error('no subject specified')

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
      html: htmlPlain ? juice(htmlPlain, { extraCss }) : null,
      subject: subject
    }
  })
}

module.exports = async function (template, data) {
  if (!template) throw new Error('no template specified')
  return getEmail(template, data)
}
