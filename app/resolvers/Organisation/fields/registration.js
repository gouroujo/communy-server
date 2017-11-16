module.exports = (organisation, { userId }, { auth, currentUserId, loaders }) => {
  if (!auth) return null;
  if (userId && userId !== currentUserId) {
    if (!auth.check(`organisation:${organisation._id}:user_view`)) return null
  }

  return loaders.RegistrationLink.load({
    "organisation._id": organisation._id,
    "user._id": userId || currentUserId,
  })
}
