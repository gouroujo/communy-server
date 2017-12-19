module.exports = {
  id(event) {
    return event._id || event._id || event.id;
  },
  startTime(event, args, { getField }) {
    return getField('startTime', event, 'Event');
  },
  endTime(event, args, { getField }) {
    return getField('endTime', event, 'Event');
  },
  open(event, args, { getField }) {
    return getField('open', event, 'Event')
      .then(r => r ? r : false)
  },
  nanswer(event, params, { getField }) {
    return getField('nanswers', event, 'Event');
  },
  nno(event, params, { getField }) {
    return getField('nno', event, 'Event');
  },
  nmb(event, params, { getField }) {
    return getField('nmb', event, 'Event');
  },
  nyes(event, params, { getField }) {
    return getField('nyes', event, 'Event');
  },
  organisation(event, args, { getField }) {
    return getField('organisation', event, 'Event');
  },
  networks(event, args, { getField }) {
    return getField('networks', event, 'Event');
  },
  duration: require('./duration'),
  participation: require('./participation'),
  participations: require('./participations'),
}
