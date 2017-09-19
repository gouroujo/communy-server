const { graphqlExpress } = require('graphql-server-express');
const { makeExecutableSchema } = require('graphql-tools');
const OpticsAgent = require('optics-agent');
const config = require('./config');

const executableSchema = makeExecutableSchema({
  typeDefs: [
    require('./graphs/root.graphql'),
    require('./graphs/address.graphql'),
    require('./graphs/event.graphql'),
    require('./graphs/organisation.graphql'),
    require('./graphs/user.graphql'),
    require('./graphs/registration.graphql'),
  ],
  resolvers: require('./resolvers'),
});

const { models } = require('./db');

if (config.get('OPTICS_API_KEY')) {
  OpticsAgent.instrumentSchema(executableSchema)
}

module.exports = function (request, result) {
  const token = request.headers.authorization || request.body.variables && request.body.variables.token;
  return models.User.findByToken(token)
  .then(user => {
    return graphqlExpress((req, res) => {
      return {
        schema: executableSchema,
        context: {
          opticsContext: config.get('OPTICS_API_KEY') ? OpticsAgent.context(req) : null,
          currentUser: user,
        }
      }
    })(request, result)
  })
  .catch(e => {
    console.log(e);
    result.status(401).send(e.message)
  });
}
