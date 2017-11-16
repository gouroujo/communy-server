module.exports = (network, { search, limit, offset, role, ack, confirm }, { auth, models }) => {
  if (!auth || !auth.check(`network:${network._id}:user_list`)) return null;

  const query = models.Membership.find({
    "network._id": network._id,
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
