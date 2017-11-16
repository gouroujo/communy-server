module.exports = async (_, {id, networkId }, { auth, models, logger }) => {
  if (!auth) return null;
  if (!auth.check(`organisation:${id}:remove_network`)) return null;

  try {
    const partnership = await models.Partnership.findOne({
      "organisation._id": id,
      "network._id": networkId
    });
    if (!partnership) return null;

    const [ organisation ] = await Promise.all([
      models.Organisation.findByIdAndUpdate(id, {
        $inc: {
          nnetworks: (partnership.ack && partnership.confirm) ? -1 : 0
        }
      }, { new: true }).lean().exec(),
      models.Network.updateOne({ "_id": networkId}, {
        $inc: {
          norganisations: (partnership.ack && partnership.confirm) ? -1 : 0
        }
      }).lean().exec(),
      partnership.remove()
    ]);

    return organisation;
  } catch(e) {
    logger.error(e);
    return null
  }
}
