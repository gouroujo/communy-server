const { models } = require('../../db');
const { orgStatus } = require('../../dict');

module.exports = function (parent, { input }, { currentUser, loaders }) {
  if (!currentUser) return new Error('Unauthorized');

  return models.Organisation.create(Object.assign({}, input, {
    nusers: 1,
  }))
  .then(organisation => {
    return Promise.all([
      Promise.resolve(organisation),
      models.User.update({ _id: currentUser._id }, {
        $push: { registrations: {
          ack: true,
          confirm: true,
          role: orgStatus.ADMIN,
          organisation: organisation.toObject(),
        }},
        $inc: { norganisations: 1 }
      }),
      models.Registration.create({
        user: currentUser.toObject(),
        organisation: organisation.toObject(),
        ack: true,
        confirm: true,
        role: orgStatus.ADMIN,
      })
    ])
  })
  .then(([ organisation ]) => {
    loaders.Organisation.prime(organisation._id, organisation)
    return organisation
  });
}
