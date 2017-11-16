
module.exports = {
  User: require('./fields'),
  Query: {
    user(parent, params, { currentUserId, loaders }) {
      if (!currentUserId) return null;
      return loaders.User.load(currentUserId);
    },
  },
  Mutation: {
    ackOrganisationToUser: require('./mutations/ackOrganisationToUser'),
    editUser: require('./mutations/editUser'),
    joinOrganisationToUser: require('./mutations/joinOrganisationToUser'),
    leaveOrganisationToUser: require('./mutations/leaveOrganisationToUser'),
    linkFacebookToUser: require('./mutations/linkFacebookToUser'),
  }
}
