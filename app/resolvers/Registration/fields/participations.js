
module.exports = async (registration, { before, after, limit, offset, answer, answers }, { getField, auth, currentUserId, models, logger }) => {
  const query = models.Participation.find({});

  try {
    const user = await getField('user', registration, 'Registration');
    const organisation = await getField('organisation', registration, 'Registration');

    if (user._id === currentUserId) {
      query.where('user._id').equals(currentUserId);
    } else if (organisation && auth.check(`organisation:${organisation._id}:list_participations`)) {
      query.where('user._id').equals(user._id);
    } else {
      return []
    }

    query.where('organisation._id').equals(organisation._id);

    if (answer) query.where('answer').equals(answer);
    if (answers) {
      if (answers.length === 0) query.where('answer').equals(null)
      else query.where('answer').in(answers)
    }
    if (after) query.gte('event.endTime', after);
    if (before) query.lte('event.startTime', before);

    return query.sort('event.endTime').limit(limit).skip(offset).lean().exec()

  } catch (e) {
    logger.error(e)
    return []
  }


}
