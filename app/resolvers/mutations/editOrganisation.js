const { models } = require('../../db');

module.exports = function (parent, { id, input }, { currentUser }) {
  if (!currentUser) return new Error('Unauthorized');
  if (!currentUser.permissions.check(`organisation:${id}:edit`)) return new Error('Forbidden');

  return Promise.all([
    models.Organisation.findByIdAndUpdate(id, input, { new: true }),
    models.Registration.updateMany({
      "organisation._id": id
    }, {
      $set: {
        "organisation.title": input.title,
      }
    }),
    models.User.updateMany({
      "organisations": {
        $elemMatch: { _id: id }
      }
    }, {
      $set: {
        "organisations.$.title": input.title,
      }
    }),
  ])
  .then(([ organisation ]) => organisation)
  .catch(e => console.log(e))
}
