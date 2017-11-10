const cloudinary = require('cloudinary');
const { promisify } = require('util');
const logger = require('logger');
const config = require('config');

cloudinary.config({
  cloud_name: config.get('CLOUDINARY_CLOUD'),
  api_key: config.get('CLOUDINARY_KEY'),
  api_secret: config.get('CLOUDINARY_SECRET')
});

module.exports = {
  url(path, options) {
    return cloudinary.url(path, options)
  },
  upload(file, options) {
    logger.info(file)
    return promisify(cloudinary.v2.uploader.upload)(file, options)
  }
}
