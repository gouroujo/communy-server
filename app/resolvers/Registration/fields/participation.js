
module.exports = async (registration, { eventId }, { getField, loaders, auth, currentUserId, logger }) => {
  try {
    const user = await getField('user', registration, 'Registration');
    if ((user._id !== currentUserId) && !auth.check(`organisation:${registration.organisation._id}:event_add_user`)) {
      return null;
    }

    return loaders.EventParticipationForUser(user._id).load(eventId)
  } catch(e) {
    logger.error(e);
    return null;
  }
}
