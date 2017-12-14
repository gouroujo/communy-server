const { models } = require('db')
const config = require('config')
const { pick } = require('lodash')
const { verify } = require('jsonwebtoken')

module.exports = (req, res) => {
  const { token } = req.body
  if (!token) return res.sendStatus(400)

  verify(token, config.get('SECRET'), {
    subject: 'confirm'
  }, (err, decoded) => {
    if (err) return res.sendStatus(401)
    models.User.findByIdAndUpdate(decoded.id, { confirm: true }, { new: true }).then(user => {
      if(!user) return res.sendStatus(404)
      return res.json(pick(user, ['id', 'firstname', 'lastname', 'email']))
    })
  })
}
