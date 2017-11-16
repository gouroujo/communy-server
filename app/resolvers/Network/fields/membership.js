module.exports = (network, { userId }, { auth, currentUserId, loaders }) => {
  if (!auth) return null;
  if (userId && userId !== currentUserId) {
    if (!auth.check(`network:${network._id}:user_view`)) return null;
  }

  return loaders.NetworkMembershipForUser(userId || currentUserId).load(network._id)
}
