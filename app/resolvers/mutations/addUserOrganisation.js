const { models } = require('../../db');
const inviteUsers = require('../../tasks/inviteUsers');

const pubsub = require('../../utils/pubsub');

module.exports = function (parent, { id, input }, { currentUser }) {
  if (!currentUser) return new Error('Unauthorized');
  if (!currentUser.permissions.check(`organisation:${id}:add_user`)) return new Error('Forbidden');

  return models.Organisation.findById(id)
  .then(organisation => {
    if (!organisation) return new Error('Organisation Not Found');
    // --- Invite by USERID
    if (input.userId) {
      return models.User.findById(input.userId)
      .then(user => {
        if (!user) return new Error('User Not Found');
        return inviteUsers([ user ], organisation)
      })
    }
    // --- Invite by EMAIL
    if (input.email) {
      return models.User.findOneAndCreate({ email: input.email }, { email: input.email }, { new: true, upsert: true })
      .then(user => {
        return inviteUsers([ user ], organisation)
      })
    }
    // --- Invite with an array of EMAILS
    if (input.emails) {
      return models.User.bulkWrite(input.emails.map(e => ({
        updateOne: {
          filter: { email: e },
          update: {
            $set : { email: e },
          },
          upsert: true,
        }
      })), { ordered: false })
      .then(() => models.User.find({ email: { $in: input.emails } }))
      .then(users => {
        return inviteUsers(users, organisation)
      })
    }
  })
  .then(([organisation, users]) => {
    if (!config.get('PUBSUB_TOPIC_EMAIL')) {
      console.log('No pubsub topic defined to send invitation emails. messages not send');
      return organisation;
    }
    return pubsub.publishMessage(config.get('PUBSUB_TOPIC_EMAIL'), users.map(u => ({
      data: {
        token: {
          id: u.id,
          organisationId: organisation.id,
        },
        author: currentUser.fullname,
        organisation: {
          id: organisation.id,
          title: organisation.title,
        },
        user: {
          fullname: u.fullname,
          email: u.email,
        },
        subject: 'invite',
      }
    })))
    .then(() => {
      return organisation
    })
  })
  .catch(e => {
    console.log(e);
    throw new Error('Bad Request')
  });
}
