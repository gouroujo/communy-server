const { models } = require('../db');

module.exports = function(user, options) {
  if (!user) return new Error('You must pass a user instance or a userId to minify.')
  return ((user instanceof models.User) ? Promise.resolve(user) : models.User.findById(user).lean())
    .then(u => {
      if(!u) return new Error('User Not Found');
      return Object.assign({
          ref: u._id,
          fullname: u.fullname,
          avatar: u.avatar,
          name: u.name,
          t: Date.now(),
        }, options)
    })
}
