module.exports = async (parent, { id }, { auth, models, logger }) => {
  if (!auth) return null;
  try {
    const event = await models.Event.findById(id);
    if (!event) return null;
    if (!event.organisation || !event.organisation._id) return null;
    if (!auth.check(`organisation:${event.organisation._id}:event_delete`))return null;
    await event.remove();
    await models.Participation.remove({ "event._id": event._id })

    return null;

  } catch (e) {
    logger.error(e);
    return null;
  }
}
