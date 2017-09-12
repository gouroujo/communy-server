const models = require('../db').models;

module.exports = function(req, res) {
  const { token } = req.body;
  models.User.findByToken(token)
  .then(user => {
    if (!user) return res.sendStatus(400);
    return res.sendStatus(200);
  })
  .catch(e => {
    console.log(e);
    return res.sendStatus(400);
  });
}
