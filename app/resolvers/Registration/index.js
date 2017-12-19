
module.exports = {
  Registration: require('./fields'),
  Query: {
    registration(root, { userId, organisationId }, { models }) {
      return models.Registration.findOne({"organisation._id": organisationId, "user._id": userId })
    }
  },
  Mutation: {
    setRoleToRegistration: require('./mutations/setRoleToRegistration'),
  }
}
