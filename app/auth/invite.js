const models = require('../db').models;
const config = require('../config');
const { verify } = require('jsonwebtoken');
const verifyAsync = require('util').promisify(verify);

module.exports = function(req, res) {
  const { token } = req.body;

  return Promise.resolve()
  .then(() => {
    if (!token) throw new Error('No token provided');
    return verifyAsync(token, config.get('SECRET'))
  })
  .then(payload => {
    return models.User.findById(payload.id)
    .then(user => {
      const userOrg = user.organisations.id(payload.organisationId)
      // User has already join the organisation and acknowledged
      if (userOrg && userOrg.ack) {
        return Promise.all([
          Promise.resolve(user),
          models.Organisation.findById(payload.organisationId)
        ])
      }

      return Promise.all([
        Promise.resolve(user),
        models.Organisation.findByIdAndUpdate(payload.organisationId,
          {
            "$inc": {
              nusers: 1,
              nwt_ack: -1,
            }
          }, { new: true }
        ),
        models.Registration.updateOne(
          {
            "user._id": payload.id,
            "organisation._id": payload.organisationId,
          },
          {
            ack: true
          }
        ),
        models.User.updateOne(
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
        )
      ]);
    })
  })
  .then(([ user, organisation ]) => {
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
