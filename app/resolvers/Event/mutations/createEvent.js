const geocoder = require('utils/geocoder');

module.exports = async (parent, { input, organisationId }, { auth, language, models, logger }) => {
  if (!auth) return null;
  if (!auth.check(`organisation:${organisationId}:event_create`)) return null;

  const organisation = await models.Organisation.findById(organisationId, 'title')
  if (!organisation) return new Error('organisation not found');

  let newEvent = Object.assign(input, { organisation })
  if (input.address) {
    try {
      const address = await geocoder(input.address, language)
      newEvent.address = Object.assign({}, address, input.address)
    } catch (e) {
      logger.error(e)
    }
  }

  if (input.allNetwork) {
    const networks = await models.Partnership.find({
      "organisation._id": organisationId,
      "ack": true
    });
    newEvent.networks = networks.map(n => ({ _id: n._id, title: n.title }))
  } else if (input.networkIds && input.networkIds.length > 0) {
    const networks = await models.Partnership.find({
      "organisation._id": organisationId,
      "network._id": { $in: input.networks },
      "ack": true,
    });
    newEvent.networks = networks.map(n => ({ _id: n._id, title: n.title }))
  }

  const [ event ] = await Promise.all([
    models.Event.create(newEvent),
    organisation.update({ $inc: { nevents: 1 }})
  ])

  return event
}
