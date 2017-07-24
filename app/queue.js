const { REDIS_URI } = require('./config');

module.exports = require('kue').createQueue({ redis: REDIS_URI });
