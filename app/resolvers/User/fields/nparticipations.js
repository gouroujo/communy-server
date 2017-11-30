
module.exports = async (user, { before, after, answer, answers, organisationId }, { auth, currentUserId, models }) => {
  const query = models.Participation.count({});

  if (user._id === currentUserId) {
    query.where('user._id').equals(currentUserId);
  } else if (organisationId && auth.check(`organisation:${organisationId}:event_add_user`)) {
    query.where('user._id').equals(user._id);
    query.where('organisation._id').equals(organisationId);
  } else {
    return null;
  }

  if (answer) query.where('answer').equals(answer);
  if (answers) {
    if (answers.length === 0) query.where('answer').equals(null)
    else query.where('answer').in(answers)
  }
  if (after) query.gte('event.endTime', after);
  if (before) query.lte('event.startTime', before);

  return query.exec()


}
