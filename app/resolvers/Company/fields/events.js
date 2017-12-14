module.exports = (organisation, { after, before, limit, offset }, { auth, models }) => {
  if (!auth || !auth.check(`organisation:${organisation._id}:event_list`)) return null;

  const query = models.Event.find({
    "organisation._id": organisation._id
  })

  if (after) query.gte('endTime', after)
  if (before) query.lte('startTime', before)
  return query.sort('endTime').limit(limit).skip(offset).lean().exec()
}
