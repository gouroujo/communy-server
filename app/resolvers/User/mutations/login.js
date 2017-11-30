module.exports = async (parent, { input }, { models, logger }) => {
  try {
    const user = await models.User.findOne({ email: input.email }, 'password salt')
    if (!user) return null;

    const auth = await user.comparePassword(input.password)
    if (!auth) return null;

    const token = await user.getToken();
    user.token = token;
    return user

  } catch (e) {
    logger.error(e);
    return null;
  }

}
