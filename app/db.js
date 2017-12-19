const mongoose = require('mongoose')
const config = require('config')
const logger = require('logger')

const OrganisationSchema = require('./schemas/organisation');
const RegistrationSchema = require('./schemas/registration');
const UserSchema = require('./schemas/user');
const ParticipationSchema = require('./schemas/participation');
const EventSchema = require('./schemas/event');
const MailingSchema = require('./schemas/mailing');
const MessageSchema = require('./schemas/message');
const CompanySchema = require('./schemas/company');
const PartnershipSchema = require('./schemas/partnership');
const EmploymentSchema = require('./schemas/employment');

const NewsfeedSchema = require('./schemas/newsfeed');

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
    Company: mongoose.model('Company', CompanySchema),
    Partnership: mongoose.model('Partnership', PartnershipSchema),
    Employment: mongoose.model('Employment', EmploymentSchema),
    Newsfeed: mongoose.model('Newsfeed', NewsfeedSchema)
  },
  mongoose: mongoose,
}

if (config.get('DEBUG')) {
  logger.debug("DEBUG mode is on")
  db.mongoose.set('debug', true)
} else {
  db.mongoose.set('debug', false)
}
// mongoose.set('debug', function (coll, method, query, doc) {
//   console.log(coll, method, query, doc)
// });

logger.debug(`Trying to connect to mongo on ${config.get('MONGO_URI')}`)
db.mongoose.connect(config.get('MONGO_URI'), {
  useMongoClient: true,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 1000,
  keepAlive: 1,
  connectTimeoutMS: 30000
})
.then(() => {
  logger.info('Successfully connected to MongoDB')
})
.catch(e => {
  logger.error(`Mongo Connection : ${e.message}`)
})

module.exports = db
