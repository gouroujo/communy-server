const models = require('../db').models;
const config = require('../config');
const { verify } = require('jsonwebtoken');

module.exports = function(req, res) {
  const { token } = req.body;

  return new Promise((res, rej) => {
    if (!token) return rej('You must provide a valid token');
    verify(token, config.get('SECRET'), (err, payload) => {
      if(err) rej(err);
      res(payload);
    })
  })
  .then(payload => {
    return Promise.all([
      models.Organisation.findByIdAndUpdate(payload.organisationId,
        {
          "$inc": {
            nusers: 1,
            nwt_ack: -1,
          }
        }, { new: true }
      ),
      models.User.findOneAndUpdate(
        {
          "_id": payload.id,
          "organisations": {
            "$elemMatch": {
              "_id": payload.organisationId,
              "ack": false
            }
          }
        },
        {
          "$set": {
            "organisations.$.ack": true,
            "userCreated": true,
          },
          $inc: { norganisations: 1 },
        }
      ),
      models.Registration.updateOne(
        {
          "user._id": payload.id,
          "organisation._id": payload.organisationId,
        },
        {
          ack: true
        }
      )
    ])
    .then(([ organisation, user ]) => {
      return Promise.all([
        Promise.resolve(organisation),
        (user ? Promise.resolve(user) : models.User.findById(payload.id))
      ])
    })
  })
  .then(([ organisation, user ]) => {
    if (!user) throw new Error('User not Found')
    return user.getToken()
    .then(token => {
      if (!token) return;
      return res.append('Authorization', token).status(200).json({
        id: organisation.id,
        title: organisation.title
      });
    })
  })
  .catch(e => {
    console.log(e)
    return res.status(400).send(e.message);
  });
}
