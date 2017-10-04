const { get } = require('axios');
const cloudinary = require('../cloudinary');
const { models } = require('../db');

module.exports = async function(user, options) {
  if (!options.facebookId) throw new Error('no facebook id')
  if (!options.facebookAccessToken) throw new Error('no facebook accessToken')
  const { data } = await get(`https://graph.facebook.com/v2.9/${options.facebookId}?fields=id,first_name,last_name,picture,email&access_token=${options.facebookAccessToken}`)
  const users = await models.User.find({
    $or: [
      { facebookId: data.id },
      { email: data.email, _id: { $ne: user.id } }
    ]
  })

  if (!users.length) {
    if (!user.firstname) user.set({ firstname: data.first_name})
    if (!user.lastname) user.set({ lastname: data.last_name})
    return user.set({ facebookId: data.id })
    // TODO: upload avatar
  }

  users.map(duplicate => {
    // 1 - Merge organisations

    // 2 - Merge events

    // 3 - Merge Profile
  })

  return

}
