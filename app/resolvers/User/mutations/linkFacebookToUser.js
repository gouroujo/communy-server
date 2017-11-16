const { get } = require('axios');

module.exports = async (parent, { input }, { currentUserId, models, logger }) => {
  if (!currentUserId) return null;

  try {
    const user = await models.User.findById(currentUserId);
    if (user.facebookId) return null;

    const mergeUser = await models.User.findOne({
      facebookId: input.facebookId,
    });

    if (!mergeUser) {
      const { data } = await get(`https://graph.facebook.com/v2.9/${input.facebookId}?fields=id,first_name,last_name,picture,email&access_token=${input.facebookAccessToken}`)
      user.set({
        firstname: user.firstname || data.first_name,
        lastname: user.lastname || data.last_name,
        facebookId: data.id,
      })
      return user.save();
    }

    // TODO: merge two accounts
    return user

  } catch (e) {
    logger.error(e);
    return null;
  }

}
