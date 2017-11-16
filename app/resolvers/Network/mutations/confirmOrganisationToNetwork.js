
module.exports = async (_, { id, organisationId }, { auth, models, logger }) => {
  if (!auth) return null;
  if (!auth.check(`network:${id}:confirm_organisation`)) return null;

  try {
    const partnership = await models.Partnership.findOne({
      "organisation._id": organisationId,
      "network._id": id,
      "confirm": false,
    }, '_id');
    if (!partnership) return null;

    const [ network ] = await Promise.all([
      models.Network.findByIdAndUpdate(id, {
        $inc: {
          norganisations: 1
        }
      }).lean().exec(),
      models.Organisation.updateOne({ "_id": organisationId}, {
        $inc: {
          nnetworks: 1
        }
      }).lean().exec(),
      partnership.update({ "confirm": true })
    ])

    return network;
  } catch(e) {
    logger.error(e);
    return null
  }
}
