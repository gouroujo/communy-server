const { Types } = require('mongoose');

module.exports = {
  Company: require('./fields'),
  Query: {
    company(_, { id }, { loaders }) {
      if (!Types.ObjectId.isValid(id)) throw new Error('Invalid ID');
      return loaders.Company.load(id);
    },
  },
  Mutation: {
    addCommunityToCompany: require('./mutations/addCommunityToCompany'),
    addUsersToCompany: require('./mutations/addUsersToCompany'),
    createCompany: require('./mutations/createCompany'),
    deleteCompany: require('./mutations/deleteCompany'),
    editCompany: require('./mutations/editCompany'),
    removeCommunityToCompany: require('./mutations/removeCommunityToCompany'),
    removeUserToCompany: require('./mutations/removeUserToCompany'),
    setUserRoleToCompany: require('./mutations/setUserRoleToCompany'),
  }
}
