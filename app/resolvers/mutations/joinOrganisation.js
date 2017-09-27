const { models } = require('../../db');

module.exports = function(parent, { id }, { currentUser }) {
  const userOrg = currentUser.organisations.id(id)

  // User has already join the organisation and acknowledged
  if (userOrg && userOrg.ack) return currentUser;

  // User has not acknowledged
  if (userOrg && !userOrg.ack) {
    return Promise.all([
      models.Organisation.findByIdAndUpdate(id,
        {
          "$inc": {
            nusers: 1,
            nwt_ack: -1,
          }
        }, { new: true }
      ),
      models.User.updateOne(
        {
          "_id": currentUser._id,
          "organisations._id": id
        },
        {
          "$set": {
            "organisations.$.ack": true,
          },
          $inc: { norganisations: 1 },
        }
      ),
      models.Registration.updateOne(
        {
          "user._id": currentUser._id,
          "organisation._id": id,
        },
        {
          ack: true
        }
      )
    ])
    .then(([ organisation ]) => organisation)
    .catch(e => console.log(e));
  }

  // User has not yet join the organisation
  return models.Organisation.findById(id)
    .then(organisation => {
      if (!organisation) return new Error('Organisation Not Found');
      if (organisation.private) return new Error('Forbidden');

      return Promise.all([
        Promise.resolve(organisation),
        models.Organisation.updateOne(
          {
            _id: id,
          },
          {
            "$inc": {
              nwt_confirm: 1,
            }
          }
        ),
        models.User.updateOne(
          {
            _id: currentUser._id,
          },
          {
            $push: {
              organisations: Object.assign({}, organisation.toObject(), { ack: true, confirm: false })
            },
          }
        ),
        models.Registration.updateOne(
          {
            "user._id": currentUser._id,
            "organisation._id": id,
          },
          {
            "$set": {
              "organisation": organisation,
              "user": {
                _id: currentUser._id,
                fullname: currentUser.fullname,
                email: currentUser.email,
                avatar: currentUser.avatar,
              },
              "ack": true,
              "confirm": false,
            }
          },
          { upsert: true }
        )
      ])
    })
    .then(([organisation]) => organisation)
    .catch(e => console.log(e));
}
