const models = require('../db').models;

module.exports = function (req, res) {
  const {
    email
  } = req.body;

  if (!email) return res.sendStatus(400);

  models.User.findOne({ email })
  .then(user => {
    if (!user) return res.status(404).send('USER NOT FOUND');
    // TODO: send email
    return res.sendStatus(200);
  })
  .catch(e => {
    console.log(e);
    return res.sendStatus(500);
  })
}
