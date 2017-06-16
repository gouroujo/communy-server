module.exports = {
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost/orgaa',
  REDIS_URI: process.env.REDIS_URI || 'redis://localhost:6379',
  DEBUG: process.env.DEBUG || process.env.NODE_ENV !== 'production',
  PORT: process.env.PORT || 3030,
  HOST: process.env.HOST,
  ENDPOINT_URL: process.env.ENDPOINT_URL || '/graphql',
  GRAPHIQL: process.env.GRAPHIQL || process.env.NODE_ENV !== 'production',
  SECRET: process.env.SECRET || 'J8DfZmMBNoDLVo8L66NO6pC6avG7boqFgPtDebBj',
  SECRET_PUBLIC: process.env.SECRET || '2Y4Phhy2juvi3cKbLVtl7RfgYa0MRMZCra21dPgB',
  MAILGUN_CONFIG: {
    apiKey: process.env.MAILGUN_KEY,
    domain: process.env.MAILGUN_DOMAIN,
  },
  CLOUDINARY_SECRET: process.env.CLOUDINARY_SECRET || 'abc',
  CLOUDINARY_KEY: process.env.CLOUDINARY_KEY || '1234',
  jobs: {
    SEND_CONFIRM_EMAIL: 'send_confirmation_email',
    SEND_LOST_PW_EMAIL: 'send_lost_password_email',
    UPDATE_USER_PROFILE: 'update_user_profile'
  },
  orgStatus: {
    WAITING_ACK: 'wt_ack',
    WAITING_CONFIRM: 'wt_cfm',
    MEMBER: 'mb',
    MOD: 'mod',
    ADMIN: 'ad',
  },
  eventStatus: {
    YES: 'yes',
    NO: 'no',
    MAYBE: 'mb',
  }
}
