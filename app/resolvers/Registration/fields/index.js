const { orgPermissions } = require('dict')

module.exports = {
  id(registration) {
    return registration._id;
  },
  joined(registration) {
    return registration.ack && registration.confirm;
  },
  ack(registration, params, { getField}) {
    return getField('ack', registration, 'Registration');
  },
  confirm(registration, params, { getField}) {
    return getField('confirm', registration, 'Registration');
  },
  role(registration, params, { getField}) {
    return getField('role', registration, 'Registration');
  },
  async permissions(registration, params, { getField, logger }) {
    try {
      const role = await getField('role', registration, 'Registration')
      return orgPermissions[role] || []
    } catch(e) {
      logger.error(e)
      return []
    }
  },
  user(registration, params, { getField }) {
    return getField('user', registration, 'Registration');
  },
  organisation(registration, params, { getField }) {
    return getField('organisation', registration, 'Registration');
  },
  participation: require('./participation'),
  participations: require('./participations'),
  nparticipations: require('./nparticipations'),

}
