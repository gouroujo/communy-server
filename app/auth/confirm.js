const models = require('../db').models;

module.exports = function(req, res) {
  const { token } = req.body;
  return models.User.findByToken(token, { subject: 'confirm'})
  .then(user => {
    if (!user) return res.sendStatus(400);
    user.confirmed = true;
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
  });
}
