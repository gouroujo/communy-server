const { models } = require('../../db');
const { orgStatus } = require('../../dict');

module.exports = function (parent, { input }, { currentUser }) {
  if (!currentUser) return new Error('Unauthorized');

  return models.Organisation.create(Object.assign({}, input, {
    nusers: 1,
  }))
  .then(organisation => {
    currentUser.organisations.push()
    currentUser.norganisations++;
    return Promise.all([
      Promise.resolve(organisation),
      models.User.update({ _id: currentUser._id }, {
        $push: { organisations: Object.assign({}, organisation.toObject(), { ack: true, confirm: true, role: orgStatus.ADMIN }) },
        $inc: { norganisations: 1 }
      }),
      models.Registration.create({
        user: {
          _id: currentUser._id,
          fullname: currentUser.fullname,
          email: currentUser.email,
          avatar: currentUser.avatar,
        },
        organisation: organisation.toObject(),
        ack: true,
        confirm: true,
        role: orgStatus.ADMIN,
      })
    ])
  })
  .then(([ organisation ]) => organisation);
}
