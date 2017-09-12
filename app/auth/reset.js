const models = require('../db').models;

module.exports = function (req, res) {
  const {
    password,
    token,
  } = req.body;

  models.User.findByPublicToken(token, { subject: 'rst_psw',})
  .then(user => {
    if(!user) return res.status(404).send('USER_NOT_FOUND');

    return user.setPassword(password)
    .then(() => user.getToken())
    .then(token => {
      return res.append('Authorization', token).sendStatus(200);
    });

  }).catch(e => {
    console.log(e);
    return res.sendStatus(500);
  })
}
