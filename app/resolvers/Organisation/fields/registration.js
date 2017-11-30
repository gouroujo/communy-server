module.exports = (organisation, { userId }, { auth, currentUserId, loaders }) => {
  if (!auth) return null;
  if (userId && userId !== currentUserId) {
    if (!auth.check(`organisation:${organisation._id}:user_view`)) return null
  }

  return loaders.OrganisationRegistrationForUser(userId || currentUserId).load(organisation._id)

}
