const cloudinary = require('cloudinaryClient');
const signCloudinary = require('utils/signCloudinary');
const { sample } = require('lodash');
const demoAvatars = [
  'demo/ade.jpg',
  'demo/zoe.jpg',
  'demo/christian.jpg',
  'demo/joe.jpg',
  'demo/stevie.jpg',
  'demo/veronika.jpg',
  'demo/matt.jpg',
  'demo/helen.jpg',
  'demo/daniel.jpg',
  'demo/steve.jpg',
  'demo/elyse.png',
  'demo/molly.png',
  'demo/matthew.png',
  'demo/jenny.jpg',
  'demo/elliot.jpg',
  'demo/kristy.png',
];

module.exports = {
  id(user) {
    return user._id;
  },
  hasCredentials(user, params, { getField }) {
    return Promise.all([
      getField('password', user, 'User'),
      getField('facebookId', user, 'User')
    ]).then(([password, facebookId]) => {
      return !!(password || facebookId)
    })
  },
  fullname(user, params, { getField }) {
    return getField('fullname', user, 'User');
  },
  firstname(user, params, { getField }) {
    return getField('firstname', user, 'User');
  },
  lastname(user, params, { getField }) {
    return getField('lastname', user, 'User');
  },
  email(user, params, { getField }) {
    return getField('email', user, 'User');
  },
  birthday(user, params, { getField }) {
    return getField('birthday', user, 'User');
  },
  birthplace(user, params, { getField }) {
    return getField('birthplace', user, 'User');
  },
  phone1(user, params, { getField }) {
    return getField('phone1', user, 'User');
  },
  phone2(user, params, { getField }) {
    return getField('phone2', user, 'User');
  },
  nunreadMessage(user, params, { getField }) {
    return getField('nunreadMessage', user, 'User');
  },
  nnetworks(user, params, { getField }) {
    return getField('nnetworks', user, 'User');
  },
  norganisations(user, params, { getField }) {
    return getField('norganisations', user, 'User');
  },
  avatar(user) {
    if (!user._id) return null;
    if (user.demo) {
      return cloudinary.url(sample(demoAvatars),{
        transformation: 'avatarT',
        sign_url: true,
        secure: true,
      })
    }
    return cloudinary.url(`users/${user._id}/avatar`,{
      transformation: 'avatarT',
      default_image: 'avatar',
      sign_url: true,
      secure: true,
      version: user.avatar ? user.avatar : null
    })
  },
  avatarUploadOpts(user, params, { currentUserId, config }) {
    if (!currentUserId || user._id !== currentUserId) return null;

    const options = {
      api_key: config.get('CLOUDINARY_KEY'),
      timestamp: Date.now(),
      public_id: `users/${user._id}/logo`,
      overwrite: true,
      invalidate: true,
      tags: `avatar,${user._id},user`,
      upload_preset: 'avatar'
    };

    return JSON.stringify(Object.assign({}, options, {
      signature : signCloudinary(options)
    }));
  },

  registrations(user, params, { getField }) {
    return getField('registrations', user, 'User');
  },
  async registration(user, { organisationId }, { getField, logger }) {
    try {
      const registrations = await getField('registrations', user, 'User');
      return registrations.find(registration => String(registration.organisation._id) === organisationId)
    } catch (e) {
      logger.error(e);
      return null
    }
  },
  memberships(user, params, { getField }) {
    return getField('memberships', user, 'User');
  },

  messages: require('./messages'),
  participation: require('./participation'),
  participations: require('./participations'),
  nparticipations: require('./nparticipations'),

}
