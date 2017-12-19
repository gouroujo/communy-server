const nconf = module.exports = require('nconf');

nconf
  // 1. Command-line arguments
  .argv()
  // 2. Environment variables
  .env([
    'SITENAME',
    'HOST',
    'MONGO_URI',
    'REDIS_URI',
    'ENDPOINT_URL',
    'DEBUG',
    'GRAPHIQL',
    'SECRET',
    'CLOUDINARY_SECRET',
    'CLOUDINARY_KEY',
    'CLOUDINARY_CLOUD',
    'ENGINE_API_KEY',
    'OPENCAGE_KEY',
    'ADMIN_PASSWORD',
    'DEFAULT_ORG_ID',
    'NODE_ENV',
    'PORT',
    'PORT_WORKER',
    'MAILGUN_KEY',
    'MAILGUN_DOMAIN'
  ])
  // 3. Config file
  .file({ file: './config.json'})
  // 4. Defaults
  .defaults({
    // MongoDB connection string
    // https://docs.mongodb.org/manual/reference/connection-string/
    MONGO_URI: 'mongodb://localhost:27017/communy',
    REDIS_URI: 'redis://localhost:6379',
    PORT: 3000,
    PORT_WORKER: 8000,
    DEBUG: false,
    HOST: 'http://localhost:3000',
    SITENAME: 'Communy',
    ENDPOINT_URL: '/graphql',
    GRAPHIQL: false,
    SECRET: 'secret',
    CLOUDINARY_SECRET: '',
    CLOUDINARY_KEY: '',
    CLOUDINARY_CLOUD: '',
    OPENCAGE_KEY: '',
    ADMIN_PASSWORD: '',
  });

nconf.set('PRODUCTION', process.env.NODE_ENV === 'production');

// Check for required settings

if (nconf.get('PRODUCTION')) {
  // checkConfig('GCLOUD_PROJECT');
  // checkConfig('OPTICS_API_KEY');
  if (nconf.get('SECRET') === 'secret') {
    throw new Error(`You must set SECRET as an environment variable or in config.json!`);
  }
}
// checkConfig('OPENCAGE_KEY');
// checkConfig('CLOUDINARY_SECRET');
// checkConfig('CLOUDINARY_KEY');
// checkConfig('CLOUDINARY_CLOUD');
//
//
// function checkConfig (setting) {
//   if (!nconf.get(setting)) {
//     throw new Error(`You must set ${setting} as an environment variable or in config.json!`);
//   }
// }

module.exports = nconf
