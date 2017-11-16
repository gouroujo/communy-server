
module.exports = async (parent, { input }, { currentUserId, models, logger }) => {
  if (!currentUserId) return null;

  try {
    const user = await models.User.findById(currentUserId);

    if (
      (input.email && input.email.trim() !== user.email) ||
      (input.firstname && input.firstname.trim() !== user.firstname) ||
      (input.lastname && input.lastname.trim() !== user.lastname)
    ) {
      await Promise.all([
        models.Registration.updateMany({
          "user._id": user._id
        }, {
          "user.fullname": (user.firstname || user.lastname) ? `${user.firstname || ''} ${user.lastname || ''}` : user.email,
        }),
        models.Membership.updateMany({
          "user._id": user._id
        }, {
          "user.fullname": (user.firstname || user.lastname) ? `${user.firstname || ''} ${user.lastname || ''}` : user.email,
        }),
        models.Participation.updateMany({
          "user._id": user._id
        }, {
          "user.fullname": (user.firstname || user.lastname) ? `${user.firstname || ''} ${user.lastname || ''}` : user.email,
        })
      ])
    }

    user.set(input)
    const error = user.validateSync();
    console.log(error)
    return user.set(input).save()
  } catch(e) {
    logger.error(e);
    return null;
  }

}
