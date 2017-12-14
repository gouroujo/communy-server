const queue = require('utils/queue');

module.exports = async (parent, { input }, { models, logger }) => {
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

      queue.create('email', {
        sitename: 'Communy',
        url: 'https://communy.org',
        title: 'signin email',
        template: 'confirm',
        userId: user._id,
        token_name: 'confirm_token',
        token_options: {
          subject: 'confirm'
        }
      }).priority('high').save();
    }

    const token = await user.getToken();
    user.token = token;
    return user

  } catch (e) {
    logger.error(e);
    return null;
  }

}
