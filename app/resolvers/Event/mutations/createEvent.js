const geocoder = require('utils/geocoder');
const db = require('db');

module.exports = async (parent, { input, organisationId }, { auth, language, models, logger }) => {
  if (!auth) return null;
  if (!auth.check(`organisation:${organisationId}:event_create`)) return null;

  try {
    const organisation = await models.Organisation.findById(organisationId, 'title')
    if (!organisation) return new Error('organisation not found');

    let data = Object.assign(input, { organisation })

    if (input.address) {
      try {
        const address = await geocoder(input.address, language)
        data.address = Object.assign({}, address, input.address)
      } catch (e) {
        logger.error(e)
      }
    }

    data.uid = db.mongoose.Types.ObjectId()

    const events = await models.Event.insertMany(
      data.parts
        .sort((a, b) => a.startTime - b.startTime)
        .map((part, i) => ({
        ...data,
        number: i,
        startTime: part.startTime,
        endTime: part.endTime,
      })));

    await organisation.update({ $inc: { nevents: events.length }})

    return events[0]
  } catch (e) {
    console.log(e)
    logger.error(e);
    return null;
  }


  // return models.Event.findOne({
  //   uid: data.uid,
  //   number: 0,
  // })
}
