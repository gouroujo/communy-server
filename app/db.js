const mongoose = require('mongoose');
const config = require('./config');

const OrganisationSchema = require('./schemas/organisation');
const RegistrationSchema = require('./schemas/registration');
const UserSchema = require('./schemas/user');
const ParticipationSchema = require('./schemas/participation');
const EventSchema = require('./schemas/event');
const MailingSchema = require('./schemas/mailing');
const MessageSchema = require('./schemas/message');
const NetworkSchema = require('./schemas/network');
const PartnershipSchema = require('./schemas/partnership');
const MembershipSchema = require('./schemas/membership');

mongoose.Promise = global.Promise;

const db = {
  models: {
    Organisation: mongoose.model('Organisation', OrganisationSchema),
    Registration: mongoose.model('Registration', RegistrationSchema),
    User: mongoose.model('User', UserSchema),
    Participation: mongoose.model('Participation', ParticipationSchema),
    Event: mongoose.model('Event', EventSchema),
    Mailing: mongoose.model('Mailing', MailingSchema),
    Message: mongoose.model('Message', MessageSchema),
    Network: mongoose.model('Network', NetworkSchema),
    Partnership: mongoose.model('Partnership', PartnershipSchema),
    Membership: mongoose.model('Membership', MembershipSchema),
  },
  mongoose: mongoose,
}

db.mongoose.connect(config.get('MONGO_URI'), { useMongoClient: true }, (err) => {
  if (err) throw err;
  console.log('Successfully connected to MongoDB');
  if (config.get('DEBUG') == 1) db.mongoose.set('debug', true);
});


module.exports = db
