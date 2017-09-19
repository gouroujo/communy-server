const models = require('../db').models;

module.exports = function (req, res) {
  const {
    password,
    token,
  } = req.body;

  return models.User.findByToken(token, { subject: 'reset'})
  .then(user => {
    if (!user) return res.sendStatus(400);
    user.password = password
    return Promise.all([
      user.getToken(),
      user.save()
    ])
  })
  .then(([token]) => {
    if (!token) return;
    return res.append('Authorization', token).sendStatus(200);
  })
  .catch(e => {
    console.log(e)
    return res.status(400).send(e.message);
  })
}
