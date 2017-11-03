const { models } = require('../db');

module.exports = function (userIds, organisationId) {
  return Promise.all([
    models.User.bulkWrite([
      {
        deleteMany: {
          filter: {
            _id: { $in: userIds},
            userCreated: { $ne: true },
            registrations: {
                $elemMatch: { "organisation._id": organisationId },
                $size: 1,
            }
          }
        }
      },
      {
        updateMany: {
          filter: {
            _id: { $in: userIds},
            registrations: {
              $elemMatch: {
                $or: [
                  { "organisation._id": organisationId, ack: false },
                  { "organisation._id": organisationId, role: null },
                ]
              },
            },
            $or: [{ "registrations.1": { $exists: true } }, { userCreated: true }],
          },
          update: {
            $pull: { registrations: { "organisation._id": organisationId } },
          }
        },
      },
      {
        updateMany: {
          filter: {
            _id: { $in: userIds},
            registrations: {
              $elemMatch: { "organisation._id": organisationId, ack: true, role: { $exists: true, $ne: null } },
            },
            $or: [{ "registrations.1": { $exists: true } }, { userCreated: true }],
          },
          update: {
            $pull: { registrations: { "organisation._id": organisationId } },
            $inc: { norganisations: -1 }
          }
        },
      },
    ]),
    models.Registration.bulkWrite([
      {
        deleteMany: {
          filter: {
            "user._id": { $in: userIds },
            "organisation._id": organisationId,
          }
        }
      },
    ])
  ]).then(() => {
    return Promise.all([
      models.Registration.where({
        "organisation._id": organisationId,
        "ack": true,
        "confirm": true,
      }).count(),
      models.Registration.where({
        "organisation._id": organisationId,
        "ack": false,
        "confirm": true,
      }).count(),
      models.Registration.where({
        "organisation._id": organisationId,
        "ack": true,
        "confirm": false,
      }).count()
    ])
  }).then(([ nusers, nwt_ack, nwt_confirm ]) => {
    return models.Organisation.findByIdAndUpdate(organisationId, {
      nusers,
      nwt_confirm,
      nwt_ack,
    }, { new: true })
  })
}
