const { models } = require('db');
const logger = require('logger');

module.exports = async function (parent, { id, input }, { auth, loaders }) {
  if (!auth) return new Error('Unauthorized');
  if (!auth.check(`network:${id}:edit`)) return new Error('Forbidden');

  try {
    const network = await models.Network.findById(id);
    if (!network) return null;

    if (input.title && network.title !== input.title.trim() ) {
      const results = await Promise.all([
        models.Network.findByIdAndUpdate(id, input, { new: true }),
        models.Membership.updateMany({
          "network._id": id
        }, {
          $set: {
            "network.title": input.title,
          }
        }),
        models.Partnership.updateMany({
          "network._id": id
        }, {
          $set: {
            "network.title": input.title,
          }
        }),
        models.User.updateMany({
          "memberships": {
            $elemMatch: { "network._id": id }
          }
        }, {
          $set: {
            "memberships.$.network.title": input.title,
          }
        }),
      ]);
      loaders.Network.prime(id, results[0]);
      return results[0];
    }

    const result = await models.Network.findByIdAndUpdate(id, input, { new: true });
    loaders.Network.prime(id, result);
    return result;

  } catch(e) {
    logger.error(e);
    return null;
  }
}
