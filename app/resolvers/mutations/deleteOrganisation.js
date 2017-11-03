const { models } = require('../../db');

module.exports = function (parent, { id }, { currentUser }) {
  if (!currentUser) return new Error('Unauthorized');
  if (!currentUser.permissions.check(`organisation:${id}:delete`)) return new Error('Forbidden');

  return Promise.all([
    models.Organisation.deleteOne({ _id: id }),
    models.Event.deleteMany({ "organisation._id": id }),
    models.Registration.deleteMany({ "organisation._id": id }),
    models.User.bulkWrite([
      {
        deleteMany: {
          filter: {
            userCreated: { $ne: true },
            registrations: {
              $elemMatch: { "organisation._id": id },
              $size: 1,
            }
          }
        }
      },
      {
        updateMany: {
          filter: {
            registrations: {
              $elemMatch: {
                $or: [
                  { _id: id, ack: false },
                  { _id: id, role: null },
                ]
              },
            },
            $or: [{ "registrations.1": { $exists: true } }, { userCreated: true }],
          },
          update: {
            $pull: { registrations: { "organisation._id": id } },
          }
        },
      },
      {
        updateMany: {
          filter: {
            registrations: {
              $elemMatch: { "organisation._id": id, ack: true, role: { $exists: true, $ne: null } },
            },
            $or: [{ "registrations.1": { $exists: true } }, { userCreated: true }],
          },
          update: {
            $pull: { registrations: { "organisation._id": id } },
            $inc: { norganisations: -1 }
          }
        },
      },
    ])
  ])
  .then(() => null)
  .catch(e => console.log(e))
}
