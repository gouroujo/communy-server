const mongoose = require('mongoose');
const config = require('./config');

const OrganisationSchema = require('./schemas/organisation');
const RegistrationSchema = require('./schemas/registration');
const UserSchema = require('./schemas/user');
const EventSchema = require('./schemas/event');

mongoose.connect(config.get('MONGO_URI'), { useMongoClient: true }, (err) => {
  if (err) throw err;
  console.log('Successfully connected to MongoDB');
  if (config.get('DEBUG')) mongoose.set('debug', true);
});

mongoose.Promise = global.Promise;

module.exports = {
  models: {
    Organisation: mongoose.model('Organisation', OrganisationSchema),
    Registration: mongoose.model('Registration', RegistrationSchema),
    User: mongoose.model('User', UserSchema),
    Event: mongoose.model('Event', EventSchema),
  },
  mongoose: mongoose,
}
