module.exports = (network, { search, limit, offset, confirm }, { auth, models }) => {
  if (!auth || !auth.check(`network:${network._id}:partnership_list`)) return null;

  const query = models.Partnership.find({
    "network._id": network._id,
  });

  if (typeof search !== 'undefined') query.where('organisation.title').regex(new RegExp(search, 'i'))
  if (typeof confirm !== 'undefined') query.where('confirm').equals(confirm)

  return query
    .sort('organisation.title')
    .limit(limit)
    .skip(offset)
    .lean()
    .exec();
}
