
module.exports = {
  User: require('./fields'),
  Query: {
    user(parent, params, { currentUserId, loaders }) {
      if (!currentUserId) return null;
      return loaders.User.load(currentUserId);
    },
    me(parent, params, { currentUserId, loaders }) {
      if (!currentUserId) return null;
      return loaders.User.load(currentUserId);
    },
  },
  Mutation: {
    ackOrganisationToUser: require('./mutations/ackOrganisationToUser'),
    editUser: require('./mutations/editUser'),
    addOrganisationToUser: require('./mutations/addOrganisationToUser'),
    removeOrganisationToUser: require('./mutations/removeOrganisationToUser'),
    linkFacebookToUser: require('./mutations/linkFacebookToUser'),
    signWithFacebook: require('./mutations/signWithFacebook'),
    login: require('./mutations/login'),
    signin: require('./mutations/signin'),
  }
}
