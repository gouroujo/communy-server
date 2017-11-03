const mongoose = require('mongoose');
const config = require('./config');

const OrganisationSchema = require('./schemas/organisation');
const RegistrationSchema = require('./schemas/registration');
const UserSchema = require('./schemas/user');
const EventSchema = require('./schemas/event');
const MailingSchema = require('./schemas/mailing');
const MessageSchema = require('./schemas/message');
const MigrationSchema = require('./schemas/migration');

mongoose.Promise = global.Promise;

const db = {
  models: {
    Organisation: mongoose.model('Organisation', OrganisationSchema),
    Registration: mongoose.model('Registration', RegistrationSchema),
    User: mongoose.model('User', UserSchema),
    Event: mongoose.model('Event', EventSchema),
    Mailing: mongoose.model('Mailing', MailingSchema),
    Message: mongoose.model('Message', MessageSchema),
    Migration: mongoose.model('Migration', MigrationSchema),
  },
  mongoose: mongoose,
}

db.mongoose.connect(config.get('MONGO_URI'), { useMongoClient: true }, (err) => {
  if (err) throw err;
  console.log('Successfully connected to MongoDB');
  if (config.get('DEBUG') == 1) db.mongoose.set('debug', true);

  const normalizedPath = require("path").join(__dirname, "migrations");

  require("fs").readdirSync(normalizedPath).forEach(function(file) {
    console.log('running migration: ' + file)
    require("./migrations/" + file)(file, db);
  });
});


module.exports = db
