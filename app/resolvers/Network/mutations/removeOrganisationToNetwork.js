
module.exports = async (_, {id, organisationId }, { auth, models, logger }) => {
  if (!auth) return null;
  if (!auth.check(`network:${id}:remove_organisation`)) return null;

  try {
    const partnership = await models.Partnership.findOne({
      "organisation._id": organisationId,
      "network._id": id
    });
    if (!partnership) return null;

    const [ network ] = await Promise.all([
      models.Network.findByIdAndUpdate(id, {
        $inc: {
          norganisations: (partnership.ack && partnership.confirm) ? -1 : 0
        }
      }).lean().exec(),
      models.Organisation.updateOne({ "_id": organisationId}, {
        $inc: {
          nnetworks: (partnership.ack && partnership.confirm) ? -1 : 0
        }
      }).lean().exec(),
      partnership.remove()
    ]);

    return network;
  } catch(e) {
    logger.error(e);
    return null
  }
}
