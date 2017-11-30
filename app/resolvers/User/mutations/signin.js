// const pubsub = require('utils/pubsub');

module.exports = async (parent, { input }, { models, logger, config }) => {
  try {
    let user = await models.User.findOne({ email: input.email }, 'password salt')
    if (user) {
      const auth = await user.comparePassword(input.password)
      if (!auth) return null;
    } else {
      user = await models.User.create({
        ...input,
        confirm: false,
        userCreated: true,
      });

      // if (config.get('PUBSUB_TOPIC_EMAIL')) {
      //   await pubsub.publishMessage(config.get('PUBSUB_TOPIC_EMAIL'), {
      //     token: {
      //       id: user._id
      //     },
      //     user: {
      //       fullname: user.fullname,
      //       email: user.email,
      //     },
      //     subject: 'confirm',
      //   })
      // }
    }

    const token = await user.getToken();
    user.token = token;
    return user

  } catch (e) {
    logger.error(e);
    return null;
  }

}
