const { models } = require('../db');
const { orgStatus } = require('../config');

const minifyUser = require('../utils/minifyUser');
const minifyOrganisation = require('../utils/minifyOrganisation');

module.exports = function(u, o, role) {
  return Promise.all([
    minifyUser(u),
    minifyOrganisation(o, { role , ack: true })
  ])
  .then(([ user, organisation ]) => {
    return Promise.all([
      models.User.bulkWrite([
        {
          updateOne: {
            filter: {
              _id: user.ref,
              organisations: {
                $elemMatch: { ref: organisation.ref }
              }
            },
            update: {
              $set: {" organisations.$": organisation }
            }
          },
        },
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
              $inc: { norganisations: 1 },
            }

          }
        }
      ]),
      models.Organisation.bulkWrite([
        {
          updateOne: {
            filter: {
              _id: organisation.ref,
              users: {
                $elemMatch: { ref: user.ref }
              }
            },
            update: {
              $set: { "users.$": user }
            }

          },
        },
        {
          updateOne: {
            filter: {
              _id: organisation.ref,
              users: {
                $not: {
                  $elemMatch: { ref: user.ref }
                }
              }
            },
            update: {
              $push: { users: user },
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
