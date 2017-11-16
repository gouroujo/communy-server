const cloudinary = require('cloudinaryClient');
const signCloudinary = require('utils/signCloudinary');

module.exports = {
  id(network) {
    return network._id;
  },
  title(network, params, { getField }) {
    return getField('title', network, 'Network');
  },
  description(network, params, { getField }) {
    return getField('description', network, 'Network');
  },
  demo(network, params, { getField }) {
    return getField('demo', network, 'Network');
  },
  logo(network, { width, height, radius }) {
    if (!network._id) return null;
    return cloudinary.url(`networks/${network._id}/logo.jpg`,{
      gravity: "center",
      height: height ? Math.min(height, 300) : 150,
      radius,
      width: width ? Math.min(width, 300) : 150,
      crop: 'fit',
      default_image: 'logo',
      sign_url: true,
      secure: true,
      version: network.logo ? network.logo : null
    })
  },
  cover(network, { width, height, radius }) {
    if (!network._id) return null;
    return cloudinary.url(`networks/${network._id}/cover.jpg`,{
      gravity: "center",
      height: height ? Math.min(height, 800) : 300,
      radius,
      width: width ? Math.min(width, 1000) : 840,
      crop: 'fill',
      default_image: 'cover.jpg',
      sign_url: true,
      secure: true,
      version: network.cover ? network.cover : null
    })
  },
  logoUploadOpts(network, params, { auth, config }) {
    if (!auth || !auth.check(`network:${network._id}:upload_logo`)) return null;

    const options = {
      api_key: config.get('CLOUDINARY_KEY'),
      timestamp: Date.now(),
      public_id: `networks/${network._id}/logo`,
      overwrite: true,
      invalidate: true,
      tags: `logo,${network._id},network`,
      upload_preset: 'logo'
    };

    return JSON.stringify(Object.assign({}, options, {
      signature : signCloudinary(options)
    }));
  },
  coverUploadOpts(network, params, { auth, config }) {
    if (!auth) return null;
    if (!auth.check(`network:${network._id}:upload_cover`)) return null;

    const options = {
      api_key: config.get('CLOUDINARY_KEY'),
      timestamp: Date.now(),
      public_id: `networks/${network._id}/cover`,
      overwrite: true,
      invalidate: true,
      tags: `cover,${network._id},network`,
      upload_preset: 'cover'
    };

    return JSON.stringify(Object.assign({}, options, {
      signature : signCloudinary(options)
    }));
  },

  membership: require('./membership'),
  memberships: require('./memberships'),
  partnership: require('./partnership'),
  partnerships: require('./partnerships'),
}
