
module.exports = async (_, {id, organisationId }, { auth, models, logger }) => {
  if (!auth) return null;
  if (!auth.check(`network:${id}:add_organisation`)) return null;

  try {
    const [
      network,
      organisation
    ] = await Promise.all([
      models.Network.findById(id, '_id title').lean().exec(),
      models.Organisation.findById(organisationId, '_id title').lean().exec()
    ])
    if (!network || !organisation) return null;

    await models.Partnership.create({
      ack: false,
      confirm: true,
      organisation: {
        _id: organisation._id,
        title: organisation.title,
      },
      network: {
        _id: network._id,
        title: network.title,
      },
    });
    return network;
  } catch(e) {
    logger.error(e);
    return null
  }
}
