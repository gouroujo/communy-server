const removeUsers = require('tasks/removeNetworkUsers');
const logger = require('logger');

module.exports = async function (parent, { id, userId }, { auth, loaders }) {
  if (!auth) return null;
  if (!auth.check(`network:${id}:remove_user`)) return null;

  try {
    const network = await removeUsers([userId], id);
    loaders.Network.clear(id).prime(network._id, network);
    return network
  } catch (e) {
    logger.error(e);
    return null;
  }
}
