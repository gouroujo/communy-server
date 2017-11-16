const cloudinary = require('cloudinaryClient');
const signCloudinary = require('utils/signCloudinary');

module.exports = {
  id(organisation) {
    return organisation._id;
  },
  title(organisation, params, { getField }) {
    return getField('title', organisation, 'Organisation');
  },
  description(organisation, params, { getField }) {
    return getField('description', organisation, 'Organisation');
  },
  type(organisation, params, { getField }) {
    return getField('type', organisation, 'Organisation');
  },
  demo(organisation, params, { getField }) {
    return getField('demo', organisation, 'Organisation');
  },
  categories(organisation, params, { getField }) {
    return getField('categories', organisation, 'Organisation');
  },
  nusers(organisation, args, { getField }) {
    return getField('nusers', organisation, 'Organisation');
  },
  nack(organisation, args, { getField }) {
    return getField('nwt_ack', organisation, 'Organisation');
  },
  nconfirm(organisation, args, { getField }) {
    return getField('nwt_confirm', organisation, 'Organisation');
  },
  nevents(organisation) {
    return organisation.nevents || 0
  },
  logo(organisation, { width, height, radius }) {
    if (!organisation._id) return null;
    return cloudinary.url(`organisations/${organisation._id}/logo.jpg`,{
      gravity: "center",
      height: height ? Math.min(height, 300) : 150,
      radius,
      width: width ? Math.min(width, 300) : 150,
      crop: 'fit',
      default_image: 'logo',
      sign_url: true,
      secure: true,
      version: organisation.logo ? organisation.logo : null
    })
  },
  cover(organisation, { width, height, radius }) {
    if (!organisation._id) return null;
    return cloudinary.url(`organisations/${organisation._id}/cover.jpg`,{
      gravity: "center",
      height: height ? Math.min(height, 800) : 300,
      radius,
      width: width ? Math.min(width, 1000) : 840,
      crop: 'fill',
      sign_url: true,
      secure: true,
      version: organisation.cover ? organisation.cover : undefined
    })
  },
  logoUploadOpts(organisation, params, { auth, config }) {
    if (!auth || !auth.check(`organisation:${organisation._id}:upload_logo`)) return null;

    const options = {
      api_key: config.get('CLOUDINARY_KEY'),
      timestamp: Date.now(),
      public_id: `organisations/${organisation._id}/logo`,
      overwrite: true,
      invalidate: true,
      tags: `logo,${organisation._id},organisation`,
      upload_preset: 'logo'
    };
    return JSON.stringify(Object.assign({}, options, {
      signature : signCloudinary(options)
    }));
  },
  coverUploadOpts(organisation, params, { auth, config }) {
    if (!auth) return null;
    if (!auth.check(`organisation:${organisation._id}:upload_cover`)) return null;

    const options = {
      api_key: config.get('CLOUDINARY_KEY'),
      timestamp: Date.now(),
      public_id: `organisations/${organisation._id}/cover`,
      overwrite: true,
      invalidate: true,
      tags: `cover,${organisation._id},organisation`,
      upload_preset: 'cover'
    };
    return JSON.stringify(Object.assign({}, options, {
      signature : signCloudinary(options)
    }));
  },

  events: require('./events'),
  mailings: require('./mailings'),
  partnerships: require('./partnerships'),
  partnership: require('./partnership'),
  registration: require('./registration'),
  registrations: require('./registrations'),
}
