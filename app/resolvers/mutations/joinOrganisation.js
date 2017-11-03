const { models } = require('../../db');
const { orgStatus } = require('../../dict');

module.exports = function(parent, { id }, { currentUser, loaders }) {
  const userRegistration = currentUser.registrations.find(r => (
    String(r.organisation._id) === id
  ))

  // User has already join the organisation and acknowledged
  if (userRegistration && userRegistration.ack) return currentUser;

  // User has not acknowledged
  if (userRegistration && !userRegistration.ack) {
    return Promise.all([
      models.Organisation.findByIdAndUpdate(id,
        {
          "$inc": {
            nusers: 1,
            nwt_ack: -1,
          }
        }, { new: true }
      ),
      models.User.findOneAndUpdate(
        {
          "_id": currentUser._id,
          registrations: {
            $elemMatch: { "organisation._id": id }
          }
        },
        {
          "$set": {
            "registrations.$.ack": true,
          },
          $inc: { norganisations: 1 },
        }, { new: true }
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
    .then(([ organisation, user ]) => {
      loaders.User.clear(user._id).prime(user._id, user);
      loaders.Organisation.clear(organisation._id).prime(organisation._id, organisation)
      return organisation;
    })
    .catch(e => console.log(e));
  }

  // User has not yet join the organisation
  return models.Organisation.findById(id)
    .then(organisation => {
      if (!organisation) return new Error('Organisation Not Found');
      if (organisation.type === 'secret') return new Error('Forbidden');

      return Promise.all([
        Promise.resolve(organisation),
        models.Organisation.updateOne(
          {
            _id: id,
          },
          {
            "$inc": (organisation.type === 'public') ? {nusers: 1} : {nwt_confirm: 1}
          }
        ),
        models.User.updateOne(
          {
            _id: currentUser._id,
          },
          {
            $push: {
              registrations: {
                organisation: organisation.toObject(),
                ack: true,
                confirm: (organisation.type === 'public'),
                role: (organisation.type === 'public') ? orgStatus.MEMBER : null,
              },
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
              },
              "ack": true,
              "confirm": (organisation.type === 'public'),
              "role": (organisation.type === 'public') ? orgStatus.MEMBER : null
            }
          },
          { upsert: true }
        )
      ])
    })
    .then(([organisation]) => organisation)
    .catch(e => console.log(e));
}
