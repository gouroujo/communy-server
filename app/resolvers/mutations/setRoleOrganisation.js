const { models } = require('../../db');

module.exports = function (parent, { id, input }, { currentUser }) {
  if (!currentUser) return new Error('Unauthorized');
  if (!currentUser.permissions.check(`organisation:${id}:set_${input.role}_role`)) return new Error('Forbidden');

  return Promise.all([
    models.User.update(
      {
        _id: input.userId,
        organisations: {
          $elemMatch: { _id: id }
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
