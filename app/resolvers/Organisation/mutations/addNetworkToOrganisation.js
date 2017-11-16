module.exports = async (_, {id, networkId }, { auth , models, logger}) => {
  if (!auth) return null;
  if (!auth.check(`organisation:${id}:add_network`)) return null;

  try {
    const [
      network,
      organisation
    ] = await Promise.all([
      models.Network.findById(networkId, '_id title').lean().exec(),
      models.Organisation.findById(id, '_id title').lean().exec()
    ])
    if (!network || !organisation) return null;

    await models.Partnership.create({
      ack: true,
      confirm: false,
      organisation: {
        _id: organisation._id,
        title: organisation.title,
      },
      network: {
        _id: network._id,
        title: network.title,
      },
    });
    return organisation;
  } catch(e) {
    logger.error(e);
    return null
  }
}
