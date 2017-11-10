const { models } = require('db');
const logger = require('logger')
const { roles } = require('dict');

module.exports = async function (parent, { input }, { currentUserId, loaders }) {
  if (!currentUserId) return null;

  try {
    const currentUser = await loaders.User.load(currentUserId);
    const network = await models.Network.create(Object.assign({}, input, {
      nusers: 1,
    }));

    await Promise.all([
      models.User.update({ _id: currentUser._id }, {
        $push: { memberships: {
          ack: true,
          confirm: true,
          role: roles.ADMIN,
          network: network.toObject(),
        }},
        $inc: { nnetworks: 1 }
      }),
      models.Membership.create({
        user: {
          _id: currentUser._id,
          fullname: (currentUser.firstname || currentUser.lastname) ? `${currentUser.firstname + ' ' || ''}${currentUser.lastname || ''}` : currentUser.email
        },
        network: network.toObject(),
        ack: true,
        confirm: true,
        role: roles.ADMIN,
      })
    ]);

    loaders.Network.prime(network._id, network)
    return network;

  } catch(e) {
    logger.warn(e);
    return null;
  }
}
