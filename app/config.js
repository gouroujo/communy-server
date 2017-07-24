require('dotenv').config()

module.exports = {
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost/orgaa',
  REDIS_URI: process.env.REDIS_URI || 'redis://localhost:6379',
  DEBUG: process.env.DEBUG || process.env.NODE_ENV !== 'production',
  PRODUCTION: process.env.NODE_ENV === 'production',
  PORT: process.env.PORT || 3030,
  HOST: process.env.HOST || localhost,
  SITENAME: process.env.NAME || 'Orgaa',
  ENDPOINT_URL: process.env.ENDPOINT_URL || '/graphql',
  GRAPHIQL: process.env.GRAPHIQL || process.env.NODE_ENV !== 'production',
  SECRET: process.env.SECRET || 'J8DfZmMBNoDLVo8L66NO6pC6avG7boqFgPtDebBj',
  SECRET_PUBLIC: process.env.SECRET_PUBLIC || '2Y4Phhy2juvi3cKbLVtl7RfgYa0MRMZCra21dPgB',
  MAILGUN_CONFIG: {
    apiKey: process.env.MAILGUN_KEY,
    domain: process.env.MAILGUN_DOMAIN,
  },
  CLOUDINARY_SECRET: process.env.CLOUDINARY_SECRET || 'abc',
  CLOUDINARY_KEY: process.env.CLOUDINARY_KEY || '1234',
  jobs: {
    SEND_CONFIRM_EMAIL: 'send_confirmation_email',
    SEND_RESET_PASSWORD: 'send_reset_password',
    UPDATE_USER_PROFILE: 'update_user_profile'
  },
  orgStatus: {
    MEMBER: 'mb',
    MODERATOR: 'mod',
    ADMIN: 'ad',
  },
  eventStatus: {
    YES: 'yes',
    NO: 'no',
    MAYBE: 'mb',
  },
  orgPermissions: {
    mb: ['events', 'viewEvents'],
    mod: ['events', 'viewEvents', 'addUsers', 'createEvent'],
    ad: ['*']
  }
}
