const config = require('config')
const logger = require('logger')
const { models } =require('db')
const mailgun = require('mailgun-js')({
  apiKey: config.get('MAILGUN_KEY'),
  domain: config.get('MAILGUN_DOMAIN'),
})

const getEmail = require('./generator')

module.exports = async function (job, done) {
  try {
    const { data } = job

    const [
      organisation,
      company,
      author,
      users,
      message
    ] = await Promise.all([
      data.organisationId ? models.Organisation.findById(data.organisationId) : Promise.resolve(),
      data.companyId ? models.Company.findById(data.companyId) : Promise.resolve(),
      data.authorId ? models.User.findById(data.authorId) : Promise.resolve(),
      data.userIds || data.userId ? models.User.find({ _id: { $in: data.userIds || [data.userId] }}) : Promise.resolve([]),
      data.messageId ? models.Message.findById(data.messageId) : Promise.resolve(),
    ])

    const email = await getEmail(data.template, Object.assign(data, {
      organisation, company, message, author, user: {
        firstname: '%recipient.firstname%',
        lastname: '%recipient.lastname%',
        fullname: '%recipient.fullname%',
        token: '%recipient.token%'
      }
    }))

    const variables = await users.reduce(
      async (v, u) => (
        Object.assign(v, {
          [u.email]: Object.assign(
            u.toObject(),
            { token: data.token_name ? await u.getToken(data.token_payload, data.token_options) : null }
          )
        })
      ), {})

    await mailgun.messages().send({
      from: `${author ? `${author.fullname} - ` : ''}${data.sitename}<noreply@${config.get('MAILGUN_DOMAIN')}>`,
      'h:Reply-To': author ? author.email : undefined,
      to: users.map(u => u.email),
      'recipient-variables': variables,
      subject: email.subject,
      text: email.text,
      html: email.html,
      "o:tag": data.template
    })
    done()

  } catch (e) {
    logger.error(`${e.message} : ${e.filename} (${e.lineNumber})`)
    done(e);
  }
};
