
module.exports = async (parent, { input }, { currentUserId, models, logger, loaders }) => {
  if (!currentUserId) return null;

  try {
    const user = await models.User.findByIdAndUpdate(currentUserId, {
      ...input
    }, { new: true });

    await Promise.all([
      models.Registration.updateMany({
        "user._id": user._id
      }, {
        "user": user.toObject(),
      }),
      models.Employment.update({
        "user._id": user._id
      }, {
        "user": user.toObject(),
      }),
      models.Participation.updateMany({
        "user._id": user._id
      }, {
        "user": user.toObject(),
      })
    ])
    
    loaders.User.prime(currentUserId, user.toObject())
    return user
  } catch(e) {
    logger.error(e);
    return null;
  }

}
