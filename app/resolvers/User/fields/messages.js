
module.exports = (user, { limit, offset, organisationId, read }, { models }) => {
  const query = models.Message.find({});
  query.where('to._id').equals(user._id);
  if (typeof read !== 'undefined') query.where('readAt').ne(null)
  if (organisationId) {
    query.where('organisation._id').equals(organisationId);
  }
  return query.sort('sendAt').limit(limit).skip(offset).lean().exec();
}
