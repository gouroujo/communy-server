module.exports = {
  graphql: require('./graphql'),
  signin: require('./auth/signin'),
  login: require('./auth/login'),
  oauth: require('./auth/oauth'),
  confirm: require('./auth/confirm'),
  reset: require('./auth/reset'),
  recover: require('./auth/recover'),
}
