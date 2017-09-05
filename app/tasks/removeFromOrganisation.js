const { models } = require('../db');
const { orgStatus } = require('../config');

const minifyUser = require('../utils/minifyUser');
const minifyOrganisation = require('../utils/minifyOrganisation');

module.exports = function(u, o) {
  return Promise.all([
    Promise.all(Array.isArray(u) ? u.map(us => minifyUser(us, { role: null, ack: false })) : [minifyUser(u, { role: null, ack: false })]),
    minifyOrganisation(o, { role: null, ack: false })
  ])
  .then(([ users, organisation ]) => {
    return Promise.all([
      models.User.bulkWrite([
        {
          deleteMany: {
            filter: {
              _id: { $in: users.map(user => user.ref)},
              userCreated: { $ne: true },
              organisations: {
                  $elemMatch: { ref: organisation.ref },
                  $size: 1,
              }
            }
          }
        },
        {
          updateMany: {
            filter: {
              _id: { $in: users.map(user => user.ref)},
              organisations: {
                $elemMatch: {
                  $or: [
                    { ref: organisation.ref, ack: false },
                    { ref: organisation.ref, role: null },
                  ]
                },
              },
              $or: [{ "organisations.1": { $exists: true } }, { userCreated: true }],
            },
            update: {
              $pull: { organisations: { ref: organisation.ref } },
            }
          },
        },
        {
          updateMany: {
            filter: {
              _id: { $in: users.map(user => user.ref)},
              organisations: {
                $elemMatch: { ref: organisation.ref, ack: true, role: { $exists: true, $ne: null } },
              },
              $or: [{ "organisations.1": { $exists: true } }, { userCreated: true }],
            },
            update: {
              $pull: { organisations: { ref: organisation.ref } },
              $inc: { norganisations: -1 }
            }
          },
        },
      ]),
      models.Organisation.bulkWrite(
        users.reduce((op, user) => (
          op.concat([
            {
              updateOne: {
                filter: {
                  _id: organisation.ref,
                  wt_confirm: {
                    $elemMatch: { ref: user.ref }
                  },
                },
                update: {
                  $pull: { wt_confirm: { ref: user.ref } },
                  $inc: { nwt_confirm: -1 }
                }
              }
            },
            {
              updateOne: {
                filter: {
                  _id: organisation.ref,
                  wt_ack: {
                    $elemMatch: { ref: user.ref }
                  },
                },
                update: {
                  $pull: { wt_ack: { ref: user.ref } },
                  $inc: { nwt_ack: -1 }
                }
              }
            },
            {
              updateOne: {
                filter: {
                  _id: organisation.ref,
                  users: {
                    $elemMatch: { ref: user.ref }
                  },
                },
                update: {
                  $pull: { users: { ref: user.ref } },
                  $inc: { nusers: -1 },
                }
              }
            }
          ])
        ), [])
      )
    ])
  })
}
