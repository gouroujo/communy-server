const { models, mongoose } = require('../db');

module.exports = {
  Registration: {
    id(registration) {
      return registration._id;
    },
    joined(registration) {
      return registration.ack && registration.confirm;
    },
    ack(registration) {
      return registration.ack
    },
    confirm(registration) {
      return registration.confirm
    },
    user(registration, params, { getField}) {
      return getField('user', registration, 'Registration');
    }
  }
}
