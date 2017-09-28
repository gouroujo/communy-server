const { models } = require('../../db');
const { orgStatus } = require('../../dict');
const config = require('../../config');

const pubsub = require('../../utils/pubsub');

module.exports = function (parent, { id, input }, { currentUser }) {
  if (!currentUser) return new Error('Unauthorized');
  if (!currentUser.permissions.check(`organisation:${id}:add_user`)) return new Error('Forbidden');
  const date = new Date();

  // 1 - Find the organisation
  return models.Organisation.findById(id)
  .then(organisation => {
    if (!organisation) return new Error('Organisation Not Found');

    // 2 - Create all the users
    return models.User.bulkWrite(input.users.map(user => ({
      updateOne: {
        filter: {
          email: user.email
        },
        update: {
          $setOnInsert: {
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            userCreated: false,
            norganisations: 0,
          },
        },
        upsert: true,
      }
    })), { ordered: false })
    // 3 - Find the newly created users
    .then(() => models.User.find({ email: { $in: input.users.map(u => u.email) } }))
    .then(users => {
      return Promise.all([
        // 4a - Add the users with no pending request
        models.User.updateMany({
          _id: { $in: users.map(u => u._id) },
          organisations: {
            $not: {
              $elemMatch: { _id: organisation._id }
            }
          }
        }, {
          $push: {
            organisations: {
              _id: organisation._id,
              title: organisation.title,
              logo: organisation.logo,
              confirm: true,
              role: orgStatus.MEMBER,
            }
          }
        }),
        // 4b - Add the users who have already request to join
        models.User.updateMany({
          _id: { $in: users.map(u => u._id) },
          organisations: {
            $elemMatch: { _id: organisation._id, ack: true, role: null }
          }
        }, {
          $set: {
            "organisations.$.confirm": true,
            "organisations.$.role": orgStatus.MEMBER
          },
          $inc: { norganisations: 1 },
        }),
        // 4c - Write all the required registrations (one per user)
        models.Registration.bulkWrite(users.map(user => ({
          updateOne: {
            filter: {
              "user._id": user._id,
              "organisation._id": organisation._id
            },
            update: {
              $set : {
                confirm: true,
                role: orgStatus.MEMBER,
                updatedAt: date,
              },
              $setOnInsert: {
                ack: false,
                "user._id": user._id,
                "user.email": user.email,
                "user.fullname": user.fullname,
                "user.avatar": user.avatar,
                "organisation._id": organisation._id,
                "organisation.title": organisation.title,
                "organisation.logo": organisation.logo,
                createdAt: date,
              }
            },
            upsert: true,
          }
        })), { ordered: false })
      ])
      // 5 - Update the stats of the organisation and return the result
      .then(([ resInvited, resConfirmed ]) => {
        return Promise.all([
          models.Organisation.findByIdAndUpdate(organisation._id, {
            $inc: {
              nusers: resConfirmed.n,
              nwt_ack: resInvited.n,
              nwt_confirm: -resConfirmed.n,
            }
          }, { new: true }),
          Promise.resolve(users)
        ])
      })
    })
  })
  // 6 - Send the invitation emails
  .then(([organisation, users]) => {
    if (!config.get('PUBSUB_TOPIC_EMAIL')) {
      console.log('No pubsub topic defined to send invitation emails. messages not send');
      return organisation;
    }
    return Promise.all([
      users.map(user => pubsub.publishMessage(config.get('PUBSUB_TOPIC_EMAIL'), {
        token: {
          id: user.id,
          organisationId: organisation.id,
        },
        author: currentUser.fullname,
        organisation: {
          id: organisation.id,
          title: organisation.title,
        },
        user: {
          fullname: user.fullname,
          email: user.email,
        },
        subject: 'invite',
      }))
    ])
    .then(() => {
      return organisation
    })
  })
  .catch(e => {
    console.log(e);
    throw new Error('Bad Request')
  });
}
