const mongoose = require('mongoose');
const config = require('./config');

mongoose.connect(config.MONGO_URI, (err) => {
  if (err) throw err;
  console.log('Successfully connected to MongoDB');
});
mongoose.Promise = global.Promise;

module.exports = {
  models: {
    Organisation: mongoose.model('Organisation', require('./schemas/organisation')),
    User: mongoose.model('User', require('./schemas/user')),
    Event: mongoose.model('Event', require('./schemas/event')),
  },
  mongoose: mongoose,
}
