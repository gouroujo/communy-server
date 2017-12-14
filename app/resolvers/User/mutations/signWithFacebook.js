const { get } = require('axios');

module.exports = async (parent, { input }, { models, logger }) => {
  try {
    const { data } = await get(`https://graph.facebook.com/v2.9/${input.facebookId}?fields=id,first_name,last_name,picture,email&access_token=${input.facebookAccessToken}`)
    const users = await models.User.find({
      $or: [
        { facebookId: data.id },
        { email: data.email }
      ]
    })

    if (!users.length) {
      const user = await models.User.create({
        firstname: data.first_name,
        lastname: data.last_name,
        email: data.email,
        facebookId: data.id,
        // avatar: data.picture ? data.picture.data.url : null,
        confirm: true,
        userCreated: true,
      })
      user.token = await user.getToken()
      return user;
    }

    if (users.length === 1) {
      const [ user ] = users;
      if (
        (user.facebookId === data.id) ||
        (!user.facebookId && !user.password && user.email === data.email)
      ) {

        if (!user.facebookId) await user.update({ facebookId: data.id });
        const token = await user.getToken()
        user.token = token
        return user;
      }
    }
  } catch (e) {
    logger.error(e);
    return null;
  }

}
