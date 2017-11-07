const { models, mongoose } = require('../db');
const lodash = require('lodash');
const faker = require('faker');
var moment = require('moment');
const { eventStatus, orgStatus } = require('../dict');

faker.locale = "fr";

const eventsName = [
  'Distribution de tract',
  'Réunion du bureau',
  'Réunion publique',
  'Maraude dans la ville',
  'Distribution de repas',
  'Concert',
  'Fête de fin d\'année',
  'Réunion de rentrée',
  'Entrainement',
  'Sortie sportive',
  'Rangement du local',
  'Rencontre amicale',
  'Pot de départ de Michel',
  'Visite du site historique',
  'Vente aux enchères de charité',
  'Diner de gala',
  'Vernissage de l\'exposition',
  'Découverte de la région'
]

module.exports = async function(organisationId) {
  const organisation = await models.Organisation.findById(organisationId);

  const users = lodash.times(50, (i) => {
    const id = mongoose.Types.ObjectId()
    const confirm = !((i % 10) === 0)
    const ack = !((i % 7) === 0)
    return {
      _id: id,
      firstname: faker.name.firstName(),
      lastname: faker.name.lastName(),
      email: 'demo+' + id + '@communy.org',
      birthday: faker.date.past(),
      birthplace: faker.address.city(),
      phone1: faker.phone.phoneNumber(),
      phone2: faker.phone.phoneNumber(),
      events: [],
      demo: true,
      userCreated: false,
      registrations: [{
        _id: mongoose.Types.ObjectId(),
        organisation: {
          _id: organisation._id,
          title: organisation.title,
        },
        role: confirm ? lodash.sample(lodash.values(orgStatus)) : null,
        ack: ack,
        confirm: confirm,
      }]
    }
  });

  const registrations = users.map(user => ({
    _id: user.registrations[0]._id,
    user: {
      _id: user._id,
      fullname: `${user.firstname} ${user.lastname}`,
    },
    organisation: organisation.toObject(),
    demo: true,
    confirm: user.registrations[0].confirm,
    ack: user.registrations[0].ack,
    role: user.registrations[0].role
  }));

  const events = lodash.times(20, () => {
    const startDate = moment()
      .date(lodash.random(-30, 60))
      .hour(lodash.random(6, 22))
      .minute(15 * (lodash.random(0, 59) % 15))
      .second(0)
      .millisecond(0);

    const endDate = moment(startDate).add({
      hours: lodash.random(0, 4),
      minutes: 15 * (lodash.random(30, 90) % 15),
    });
    const nusers = lodash.random(10, 50);
    const selectedUsers = lodash.sampleSize(users, nusers);
    return {
      _id: mongoose.Types.ObjectId(),
      title: '[DEMO]' + lodash.sample(eventsName),
      description: faker.lorem.paragraphs(),
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      demo: true,
      organisation: {
        _id: organisation._id,
        title: organisation.title,
      },
      nusers: nusers,
      yes: selectedUsers.filter((u, i) => ((i % 3) === 0) && u.registrations[0].confirm),
      mb: selectedUsers.filter((u, i) => ((i % 3) === 1) && u.registrations[0].confirm),
      no: selectedUsers.filter((u, i) => ((i % 3) === 2) && u.registrations[0].confirm),
    }
  });

  organisation.set({
    demo: true,
    nusers: organisation.nusers + users.filter(user => user.registrations[0].confirm).length,
    nwt_confirm: organisation.nwt_confirm + users.filter(user => !user.registrations[0].confirm).length,
    nwt_ack: organisation.nwt_ack + users.filter(user => !user.registrations[0].ack).length,
    nevents: organisation.nevents + events.length,
  });


  return Promise.all([
    organisation.save(),
    models.User.insertMany(users),
    models.Event.insertMany(events),
    models.Registration.insertMany(registrations)
  ])
}
