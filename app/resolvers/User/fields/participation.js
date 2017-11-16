
module.exports = async (user, { eventId }, { loaders, auth, currentUserId, logger }) => {
  try {
    const participation = await loaders.UserParticipationForEvent(eventId).load(user._id);
    if (!participation) return null;
    if ((user._id !== currentUserId) && !auth.check(`organisation:${participation.organisation._id}:event_add_user`)) {
      return null;
    }

    return participation;
  } catch(e) {
    logger.error(e);
    return null;
  }
}
