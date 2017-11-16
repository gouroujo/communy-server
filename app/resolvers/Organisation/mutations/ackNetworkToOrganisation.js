
module.exports = async (_, {id, networkId }, { auth, models, logger }) => {
  if (!auth) return null;
  if (!auth.check(`organisation:${id}:confirm_network`)) return null;

  try {
    const partnership = await models.Partnership.findOne({
      "organisation._id": id,
      "network._id": networkId,
      "ack": false,
    }, '_id');
    if (!partnership) return null;

    const [ organisation ] = await Promise.all([
      models.Organisation.findByIdAndUpdate(id, {
        $inc: {
          nnetworks: 1
        }
      }, { new: true }).lean().exec(),
      models.Network.updateOne({ "_id": networkId}, {
        $inc: {
          norganisations: 1
        }
      }).lean().exec(),
      partnership.update({ "ack": true })
    ])

    return organisation;
  } catch(e) {
    logger.error(e);
    return null
  }
}
