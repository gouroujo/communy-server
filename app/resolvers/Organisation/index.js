module.exports = {
  Organisation: require('./fields'),
  Query: {
    organisations(_, { limit, offset, search }, { models }) {
      const query = models.Organisation.find({
        type: { "$ne": 'secret' }
      });

      if (typeof search !== 'undefined' && search !== '') query.where('title').regex(new RegExp(search, 'i'))
      return query.sort('title').skip(offset).limit(limit).lean().exec();
    },

    organisation(_, { id }, { loaders }) {
      // if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid ID');
      return loaders.Organisation.load(id);
    },
  },
  Mutation: {
    ackNetworkToOrganisation: require('./mutations/ackNetworkToOrganisation'),
    addNetworkToOrganisation: require('./mutations/addNetworkToOrganisation'),
    addUsersToOrganisation: require('./mutations/addUsersToOrganisation'),
    confirmUserToOrganisation: require('./mutations/confirmUserOrganisation'),
    createOrganisation: require('./mutations/createOrganisation'),
    deleteOrganisation: require('./mutations/deleteOrganisation'),
    editOrganisation: require('./mutations/editOrganisation'),
    removeNetworkToOrganisation: require('./mutations/removeNetworkToOrganisation'),
    removeUserToOrganisation: require('./mutations/removeUserToOrganisation'),
    setUserRoleToOrganisation: require('./mutations/setUserRoleToOrganisation'),
  }
}
