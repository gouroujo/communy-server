const models = require('../db').models;
const config = require('../config');
const pubsub = require('../utils/pubsub');

module.exports = function (req, res) {
  const {
    email
  } = req.body;

  if (!email) return res.sendStatus(400);

  models.User.findOne({ email })
  .then(user => {
    if (!user) return res.status(404).send('USER NOT FOUND');
    if (!config.get('PUBSUB_TOPIC_EMAIL')) {
      throw new Error('No pubsub topic defined to send reset email. message not send')
    }
    return pubsub.publishMessage(config.get('PUBSUB_TOPIC_EMAIL'), {
      token: {
        id: user._id
      },
      user: {
        fullname: user.fullname,
        email: user.email,
      },
      subject: 'reset',
    });
  })
  .then(() => {
    return res.sendStatus(200);
  })
  .catch(e => {
    console.log(e);
    res.status(500).send(e.message);
  })
}
