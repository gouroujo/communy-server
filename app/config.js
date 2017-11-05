const nconf = module.exports = require('nconf');
const path = require('path');

nconf
  // 1. Command-line arguments
  .argv()
  // 2. Environment variables
  .env([
    'GCLOUD_PROJECT',
    'PUBSUB_TOPIC_EMAIL',
    'SITENAME',
    'HOST',
    'MEMCACHE_URL',
    'USER_CACHE_LIFETIME',
    'MONGO_URI',
    'ENDPOINT_URL',
    'GRAPHIQL',
    'SECRET',
    'CLOUDINARY_SECRET',
    'CLOUDINARY_KEY',
    'CLOUDINARY_CLOUD',
    'OPTICS_API_KEY',
    'OPENCAGE_KEY',
    'ADMIN_PASSWORD',
    'DEFAULT_ORG_ID',
    'NODE_ENV',
    'PORT'
  ])
  // 3. Config file
  .file({ file: path.join(__dirname, 'config.json') })
  // 4. Defaults
  .defaults({
    // This is the id of your project in the Google Cloud Developers Console.
    GCLOUD_PROJECT: '',
    USER_CACHE_LIFETIME: 60,
    MEMCACHE_URL: process.env.GAE_MEMCACHE_HOST ? `${process.env.GAE_MEMCACHE_HOST}:${process.env.GAE_MEMCACHE_PORT}` : 'localhost:11211',
    // MongoDB connection string
    // https://docs.mongodb.org/manual/reference/connection-string/
    MONGO_URI: 'mongodb://localhost:27017/communy',
    PORT: 3030,
    DEBUG: '',
    HOST: 'http://localhost:3030',
    SITENAME: 'Communy',
    ENDPOINT_URL: '/graphql',
    GRAPHIQL: '',
    SECRET: 'secret',
    CLOUDINARY_SECRET: '',
    CLOUDINARY_KEY: '',
    CLOUDINARY_CLOUD: '',
    // OPTICS_API_KEY is required to enable optics analytics on graphql queries and mutations
    OPTICS_API_KEY: '',
    OPENCAGE_KEY: '',
    ADMIN_PASSWORD: '',
  });

nconf.set('PRODUCTION', process.env.NODE_ENV === 'production');

// Check for required settings

if (nconf.get('PRODUCTION')) {
  checkConfig('GCLOUD_PROJECT');
  // checkConfig('OPTICS_API_KEY');
  if (nconf.get('SECRET') === 'secret') {
    throw new Error(`You must set SECRET as an environment variable or in config.json!`);
  }
}
checkConfig('OPENCAGE_KEY');
checkConfig('CLOUDINARY_SECRET');
checkConfig('CLOUDINARY_KEY');
checkConfig('CLOUDINARY_CLOUD');


function checkConfig (setting) {
  if (!nconf.get(setting)) {
    throw new Error(`You must set ${setting} as an environment variable or in config.json!`);
  }
}

module.exports = nconf
