
module.exports = (user, { before, after, limit, offset, organisationId, answer }, { auth, currentUserId, models }) => {
  const query = models.Participation.find({});

  if (user._id === currentUserId) {
    query.where('user._id').equals(currentUserId);
  } else if (organisationId && auth.check(`organisation:${organisationId}:event_add_user`)) {
    query.where('user._id').equals(user._id);
    query.where('organisation._id').equals(organisationId);
  } else {
    return null;
  }

  if (answer) query.where('answer').equals(answer);
  if (after) query.gte('event.endTime', after);
  if (before) query.lte('event.startTime', before);

  return query.sort('event.endTime').limit(limit).skip(offset).lean().exec();
}
