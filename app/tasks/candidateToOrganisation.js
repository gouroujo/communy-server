const { models } = require('../db');
const { orgStatus } = require('../config');

const minifyUser = require('../utils/minifyUser');
const minifyOrganisation = require('../utils/minifyOrganisation');

module.exports = function(u, o) {
  return Promise.all([
    minifyUser(u),
    minifyOrganisation(o, { role: null, ack: true })
  ])
  .then(([ user, organisation ]) => {
    return Promise.all([
      models.User.bulkWrite([
        {
          updateOne: {
            filter: {
              _id: user.ref,
              organisations: {
                $not: {
                  $elemMatch: { ref: organisation.ref }
                }
              }
            },
            update: {
              $push: { organisations: organisation },
            }
          },
        },
        {
          updateOne: {
            filter: {
              _id: user.ref,
              organisations: {
                $elemMatch: { ref: organisation.ref, ack: { $in: [null, false] }, role: null }
              }
            },
            update: {
              $set: { "organisations.$": { ack: true, role: orgStatus.MEMBER} },
              $inc: { norganisations: 1 },
            }
          },
        },
      ]),
      models.Organisation.bulkWrite([
        {
          updateOne: {
            filter: {
              _id: organisation.ref,
              wt_confirm: {
                $not: {
                  $elemMatch: { ref: user.ref }
                }
              },
              wt_ack: {
                $not: {
                  $elemMatch: { ref: user.ref }
                }
              },
            },
            update: {
              $push: { wt_confirm: user },
              $pull: { user: { ref: user.ref } }
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
              $push: { user: Object.assign({}, user, { role: orgStatus.MEMBER }) },
              $pull: { wt_confirm: { ref: user.ref } },
              $pull: { wt_ack: { ref: user.ref } },
              $inc: { nusers: 1 },
            }
          }
        }
      ])
    ]);
  })
}
