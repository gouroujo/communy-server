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
    console.log(users, organisation)
    return Promise.all([
      models.User.bulkWrite([
        {
          updateOne: {
            filter: {
              _id: { $in: users.map(user => user.ref)},
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
              _id: { $in: users.map(user => user.ref)},
              organisations: {
                $elemMatch: { ref: organisation.ref, ack: true, role: null }
              }
            },
            update: {
              $set: { "organisations.$.role": orgStatus.MEMBER },
              $inc: { norganisations: 1 },
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
                  $push: { wt_ack: user },
                  $pull: { user: { ref: user.ref } }
                }
              }
            },
            {
              updateOne: {
                filter: {
                  _id: organisation.ref,
                  wt_confirm: {
                    $elemMatch: { ref: user.ref }
                  },
                },
                update: {
                  $push: { users: Object.assign({}, user, { role: orgStatus.MEMBER }) },
                  $pull: { wt_confirm: { ref: user.ref } },
                  // $pull: { wt_ack: { ref: user.ref } },
                  $inc: { nusers: 1 },
                }
              }
            }
          ])
        ), [])
      )
    ])
  })
}
