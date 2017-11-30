const geocoder = require('utils/geocoder');

module.exports = async (parent, { id, input }, { auth, language, models, logger }) => {
  if (!auth) return null;
  const event = await models.Event.findById(id)

  if (!event) return null;
  if (!event.organisation || !event.organisation._id) return null;
  if (!auth.check(`organisation:${event.organisation._id}:event_edit`))return null;

  if (input.address) {
    try {
      const address = await geocoder(input.address, language)
      event.set({ address: Object.assign({}, address, input.address) })
    } catch (e) {
      logger.error(e);
    }
  }

  // TODO: UPDATE PARTICIPATIONS

  if (input.allNetwork) {
    const partnerships = await models.Partnership.find({
      "organisation._id": event.organisation._id,
      "ack": true
    });
    event.set({
      networks: partnerships.map(p => {
        const network = p.get('network');
        return { _id: network._id, title: network.title }
      })
    })
  } else if (input.networkIds && input.networkIds.length > 0) {
    const partnerships = await models.Partnership.find({
      "organisation._id": event.organisation._id,
      "network._id": { $in: input.networkIds },
      "ack": true,
    });
    event.set({
      networks: partnerships.map(p => {
        const network = p.get('network');
        return { _id: network._id, title: network.title }
      })
    })
  }

  return Object.assign(event, input).save();

}
