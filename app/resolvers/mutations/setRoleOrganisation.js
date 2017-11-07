const { models } = require('../../db');

module.exports = function (parent, { id, input }, { auth }) {
  if (!auth) return null;
  if (!auth.check(`organisation:${id}:set_${input.role}_role`)) return new Error('Forbidden');

  return Promise.all([
    models.User.update(
      {
        _id: input.userId,
        registrations: {
          $elemMatch: { "organisation._id": id }
        }
      }, {
        "organisations.$.role": input.role,
      }
    ),
    models.Registration.update(
      {
        "user._id": input.userId,
        "organisation._id": id,
      }, {
        "role": input.role,
      }
    )
  ])
  .then(() => {
    return models.Organisation.findById(id);
  })
  .catch(e => {
    console.log(e);
  })
}
