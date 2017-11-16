module.exports = async (event, { userId }, { loaders, auth, currentUserId, logger }) => {
  if (!currentUserId) return null;
  if (!userId) {
    return loaders.CurrentUserParticipation.load(event._id)
  }

  try {
    const participation = await loaders.UserParticipationForEvent(event._id).load(userId);
    if (!participation) return null;
    if ((userId !== currentUserId) && !auth.check(`organisation:${participation.organisation._id}:event_add_user`)) {
      return null;
    }
    return participation;

  } catch(e) {
    logger.error(e);
    return null;
  }
}
