const config = require('config');
const { models } = require('db');
const { roles } = require('dict');
const logger = require('logger');
const pubsub = require('utils/pubsub');

module.exports = async function (parent, { id, userId }, { currentUserId, auth, loaders }) {
  if (!auth) return null;
  if (!auth.permissions.check(`network:${id}:add_user`)) return null;

  try {
    const currentUser = await loaders.User.load(currentUserId);

    const [
      user
    ] = await Promise.all([
      models.User.findOneAndUpdate(
        {
          _id: userId,
          memberships: {
            $elemMatch: { "network._id": id, ack: true, role: null }
          }
        },
        {
          $set: {
            "memberships.$.confirm": true,
            "memberships.$.role": roles.MEMBER
          },
          $inc: { nnetworks: 1 },
        }
      ),
      models.Membership.updateOne(
        {
          "user._id": userId,
          "network._id": id
        },
        {
          confirm: true,
          role: roles.MEMBER,
          updatedAt: new Date()
        }
      )
    ]);

    if (!user) return null;

    const network = models.Network.findByIdAndUpdate(id, {
      "$inc": {
        nusers: 1,
      }
    });

    if (!config.get('PUBSUB_TOPIC_EMAIL')) {
      logger.info('No pubsub topic defined to send invitation emails. messages not send');
    } else {
      await pubsub.publishMessage(config.get('PUBSUB_TOPIC_EMAIL'), {
        token: {
          id: user.id,
          networkId: network.id,
        },
        author: currentUser.fullname,
        network: {
          id: network.id,
          title: network.title,
        },
        user: {
          fullname: (user.firstname || user.lastname) ? `${user.firstname + ' ' || ''}${user.lastname || ''}` : user.email,
          email: user.email,
        },
        subject: 'confirm_network',
      })
    }

    loaders.Network.prime(network._id, network);
    return network
  } catch (e) {
    logger.error(e);
    return null;
  }

}
