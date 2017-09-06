const { models, mongoose } = require('../db');

module.exports = {
  Registration: {
    id(registration) {
      return registration._id;
    },
    joined(registration) {
      return registration.ack && registration.confirmed;
    },
    isWaitingAck(registration) {
      return !registration.ack
    },
    isWaitingConfirm(registration) {
      return !registration.confirmed
    },
  }
}
