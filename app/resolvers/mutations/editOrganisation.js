const { models } = require('../../db');

module.exports = function (parent, { id, input }, { auth, loaders }) {
  if (!auth) return new Error('Unauthorized');
  if (!auth.check(`organisation:${id}:edit`)) return new Error('Forbidden');

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
      "registrations": {
        $elemMatch: { "organisation_id": id }
      }
    }, {
      $set: {
        "registrations.$.organisation.title": input.title,
      }
    }),
  ])
  .then(([ organisation ]) => {
    loaders.Organisation.prime(organisation._id, organisation);
    return organisation;
  })
  .catch(e => console.log(e))
}
