const { models } = require('../db');

module.exports = function (userIds, networkId) {
  return Promise.all([
    models.User.bulkWrite([
      {
        deleteMany: {
          filter: {
            _id: { $in: userIds},
            userCreated: { $ne: true },
            memberships: {
                $elemMatch: { "network._id": networkId },
                $size: 1,
            },
            "registrations.0": { $exists : false }
          }
        }
      },
      {
        updateMany: {
          filter: {
            _id: { $in: userIds},
            memberships: {
              $elemMatch: {
                $or: [
                  { "network._id": networkId, ack: false },
                  { "network._id": networkId, role: null },
                ]
              },
            },
            $or: [{ "memberships.1": { $exists: true } }, { userCreated: true }],
          },
          update: {
            $pull: { memberships: { "network._id": networkId } },
          }
        },
      },
      {
        updateMany: {
          filter: {
            _id: { $in: userIds},
            memberships: {
              $elemMatch: { "network._id": networkId, ack: true, role: { $exists: true, $ne: null } },
            },
            $or: [{ "memberships.1": { $exists: true } }, { userCreated: true }],
          },
          update: {
            $pull: { memberships: { "network._id": networkId } },
            $inc: { nnetworks: -1 }
          }
        },
      },
    ]),
    models.Membership.bulkWrite([
      {
        deleteMany: {
          filter: {
            "user._id": { $in: userIds },
            "network._id": networkId,
          }
        }
      },
    ])
  ]).then(() => {
    return Promise.all([
      models.Membership.where({
        "network._id": networkId,
        "ack": true,
        "confirm": true,
      }).count(),
      models.Membership.where({
        "network._id": networkId,
        "ack": false,
        "confirm": true,
      }).count(),
      models.Membership.where({
        "network._id": networkId,
        "ack": true,
        "confirm": false,
      }).count()
    ])
  }).then(([ nusers, nusers_wt_ack, nusers_wt_confirm ]) => {
    return models.Network.findByIdAndUpdate(networkId, {
      nusers,
      nusers_wt_confirm,
      nusers_wt_ack,
    }, { new: true })
  })
}
