const { Types } = require('mongoose');

module.exports = {
  Network: require('./fields'),
  Query: {
    networks(_, { limit, offset, search }, { models }) {
      const query = models.Network.find({});
      if (typeof search !== 'undefined' && search !== '') query.where('title').regex(new RegExp(search, 'i'))
      return query.sort('title').skip(offset).limit(limit).lean();
    },

    network(_, { id }, { loaders }) {
      if (!Types.ObjectId.isValid(id)) throw new Error('Invalid ID');
      return loaders.Network.load(id);
    },
  },
  Mutation: {
    addOrganisationToNetwork: require('./mutations/addOrganisationToNetwork'),
    addUsersToNetwork: require('./mutations/addUsersNetwork'),
    confirmOrganisationToNetwork: require('./mutations/confirmOrganisationToNetwork'),
    confirmUserToNetwork: require('./mutations/confirmUserNetwork'),
    createNetwork: require('./mutations/createNetwork'),
    editNetwork: require('./mutations/editNetwork'),
    removeOrganisationToNetwork: require('./mutations/removeOrganisationToNetwork'),
    // deleteNetwork: require('./mutations/deleteOrganisation'),
    // joinOrganisation: require('./mutations/joinOrganisation'),
    // leaveOrganisation: require('./mutations/leaveOrganisation'),
    removeUserToNetwork: require('./mutations/removeUserNetwork'),
    // setRoleInOrganisation: require('./mutations/setRoleOrganisation'),
  }
}
