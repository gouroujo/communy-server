module.exports = (organisation, { search, role, limit, offset, ack, confirm }, { auth, models }) => {
  if (!auth || !auth.check(`organisation:${organisation._id}:user_list`)) return null;

  const query = models.Registration.find({
    "organisation._id": organisation._id,
  });

  if (typeof search !== 'undefined') query.where('user.fullname').regex(new RegExp(search, 'i'))
  if (typeof role !== 'undefined') query.where('role').equals(role)
  if (typeof ack !== 'undefined') query.where('ack').equals(ack)
  if (typeof confirm !== 'undefined') query.where('confirm').equals(confirm)

  return query
    .sort('user.fullname')
    .limit(limit)
    .skip(offset)
    .lean()
    .exec();
}
