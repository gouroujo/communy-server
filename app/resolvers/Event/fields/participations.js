module.exports = (event, { offset, limit, yes, no, mb }, { models }) => {
  // TODO: store the last 50/100 participations in event document
  const query = models.Participation.find({ "event._id": event._id });

  if (yes) query.where("answer", 'yes');
  if (no) query.where("answer", 'no');
  if (mb) query.where("answer", 'mb');

  return query
  .sort('user.fullname')
  .limit(limit)
  .skip(offset)
  .lean()
  .exec();
}
