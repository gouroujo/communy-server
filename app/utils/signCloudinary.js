const { omit } = require('lodash');
const crypto = require('crypto');
const { CLOUDINARY_SECRET } = require('../config');

module.exports = (data) => {
  const hash = crypto.createHash('sha1');
  const sign_data = omit(data, ['file', 'type', 'resource_type', 'api_key'])
  const sign_str = Object.keys(sign_data).sort().reduce((str, key, i) => `${str}${i>0 ? '&' : ''}${key}=${sign_data[key]}`, '') + CLOUDINARY_SECRET;
  hash.update(sign_str);
  return hash.digest('hex');
}
