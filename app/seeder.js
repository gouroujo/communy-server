var lodash = require('lodash');
var faker = require('faker');
var moment = require('moment');

const { models, mongoose } = require('./db');
const { eventStatus, orgStatus } = require('./config');

faker.locale = "fr";

var nOrgs = 10;

var users = lodash.times(nOrgs * 10, function(i) {
  return {
    _id: mongoose.Types.ObjectId(),
    firstname: faker.name.firstName(),
    lastname: faker.name.lastName(),
    password: faker.internet.password(),
    email: faker.internet.email(),
    birthday: faker.date.past(),
    birthplace: faker.address.city(),
    avatarUrl: 'http://lorempixel.com/200/200/people/' + (i%10),
    phone1: faker.phone.phoneNumber(),
    phone2: faker.phone.phoneNumber(),
    events: [],
    organisations: [],
  };
});

var events = [];

var organisations = lodash.times(nOrgs, function(i) {
  const size = lodash.random(3, nOrgs * 4);
  const selectedUsers = lodash.sampleSize(users, size);

  const org = {
    _id: mongoose.Types.ObjectId(),
    title: faker.company.companyName(),
    description: faker.lorem.paragraphs(),
    coverUrl: 'http://lorempixel.com/600/400/nature/' + (i%10),
    logoUrl: 'http://lorempixel.com/200/200/abstract/' + (i%10),
    events: [],
    users: [],
  }

  org.users = selectedUsers.map((u, i) => {
    const st = (i === 0) ? orgStatus.ADMIN : lodash.sample(lodash.values(orgStatus));
    u.organisations.push({
      title: org.title,
      logoUrl: org.logoUrl,
      status: st,
      _id: org._id,
    });
    return {
      fn: u.firstname + ' ' + u.lastname,
      em: u.email,
      av: u.avatarUrl,
      st: st,
      _id: u._id,
    }
  })


  lodash.times(lodash.floor(size / 5), function() {

    const startDate = moment()
      .date(lodash.random(-30, 60))
      .hour(lodash.random(6, 22))
      .minute(lodash.random(0, 60))
      .second(0)
      .millisecond(0);

    const endDate = moment(startDate).add({
      hours: lodash.random(0, 50),
      minutes: lodash.random(30, 90),
    });

    const userEvent = lodash.sampleSize(selectedUsers, lodash.random(3, size));

    const event = {
      _id: mongoose.Types.ObjectId(),
      title: faker.company.bsBuzz() + ' event',
      description: faker.lorem.paragraphs(),
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      organisation: {
        _id: org._id,
        title: org.title,
        logoUrl: org.logoUrl,
      },
      users: [],
    }

    event.users = userEvent.map((u, i) => {
      const st = lodash.sample(lodash.values(eventStatus));
      u.events.push({
        title: event.title,
        status: st,
        startTime: event.startTime,
        endTime: event.endTime,
        _id: event._id,
        org: org._id,
      })
      return {
        fn: u.firstname + ' ' + u.lastname,
        av: u.avatarUrl,
        st: st,
        _id: u._id,
      }
    });

    org.events.push({
      title: event.title,
      startTime: event.startTime,
      endTime: event.endTime,
      _id: event._id
    });

    events.push({
      insertOne: {
        document: event
      }
    })
  });



  return {
    insertOne: {
      document: org
    }
  };
});

models.Organisation.bulkWrite(organisations).then(r => console.log(r.insertedCount + ' organisations has been created : ' + r.isOk()));

models.Event.bulkWrite(events).then(r => console.log(r.insertedCount + ' events has been created : ' + r.isOk()))

models.User.bulkWrite(users.map(u => ({ insertOne: { document: u } }))).then(r => console.log(r.insertedCount + ' users has been created : ' + r.isOk()))
