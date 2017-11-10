const config = require('../../config');

const { models } = require('../../db');

const { roles } = require('../../dict');
const pubsub = require('../../utils/pubsub');

module.exports = async function (parent, { id, input }, { currentUserId, auth, loaders }) {
  if (!auth) return new Error('Unauthorized');
  if (!auth.permissions.check(`organisation:${id}:add_user`)) return new Error('Forbidden');
  const currentUser = await loaders.User.load(currentUserId);

  return Promise.all([
    models.User.findOneAndUpdate(
      {
        _id: input.userId,
        registrations: {
          $elemMatch: { "organisation._id": id, ack: true, role: null }
        }
      },
      {
        $set: {
          "registrations.$.confirm": true,
          "registrations.$.role": roles.MEMBER
        },
        $inc: { norganisations: 1 },
      }
    ),
    models.Registration.updateOne(
      {
        "user._id": input.userId,
        "organisation._id": id
      },
      {
        confirm: true,
        role: roles.MEMBER,
        updatedAt: new Date()
      }
    )
  ])
  .then(([ user ]) => {
    if (!user) return new Error("User Not Found")
    return models.Organisation.findByIdAndUpdate(id, {
      "$inc": {
        nusers: 1,
        nwt_confirm: -1,
      }
    })
    .then(organisation => {
      if (!config.get('PUBSUB_TOPIC_EMAIL')) {
        console.log('No pubsub topic defined to send invitation emails. messages not send');
        return organisation;
      }
      return pubsub.publishMessage(config.get('PUBSUB_TOPIC_EMAIL'), {
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
        subject: 'confirm_org',
      })
      .then(() => {
        loaders.Organisation.prime(organisation._id, organisation);
        return organisation
      })
    })
  })
  .catch(e => {
    console.log(e);
    throw new Error('Bad Request')
  });
}
