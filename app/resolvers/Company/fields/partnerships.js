module.exports = (organisation, { search, limit, offset, ack, confirm}, { auth, models }) => {
  if (!auth || !auth.check(`organisation:${organisation._id}:partnership_list`)) return null;

  const query = models.Partnership.find({
    "organisation._id": organisation._id,
  });

  if (typeof search !== 'undefined' && search !== '') query.where('network.title').regex(new RegExp(search, 'i'))
  if (typeof confirm !== 'undefined') query.where('confirm').equals(confirm)
  if (typeof ack !== 'undefined') query.where('ack').equals(ack)

  return query
    .sort('network.title')
    .limit(limit)
    .skip(offset)
    .lean()
    .exec();
}
