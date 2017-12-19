module.exports = async (_, { userId, organisationId, role }, { currentUserId, auth, models, logger, loaders }) => {
  if (!auth) return null
  if (!auth.check(`organisation:${organisationId}:set_${role}_role`)) return null

  try {
    const [ registration ] = await Promise.all([
      models.Registration.findOneAndUpdate(
        {"organisation._id": organisationId, "user._id": userId },
        { role },
        { new: true }
      ).lean(),
      models.User.findOneAndUpdate(
        {
          _id: userId,
          registrations: {
            $elemMatch: { "organisation._id": organisationId }
          }
        },{
          "organisations.$.role": role,
        }
      )
    ])
    loaders.Registration.clear(registration._id).prime(registration._id, registration)
    return registration

  } catch (e) {
    logger.error(`mutation setRoleToRegistration (userId: ${currentUserId}): ${e.message}`, e)
    return null
  }

}
