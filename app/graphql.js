const { graphqlExpress } = require('graphql-server-express');
const { makeExecutableSchema } = require('graphql-tools');
// const OpticsAgent = require('optics-agent');

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

const config = require('./config');
const { models } = require('./db');

// GraphQL Optics
// OpticsAgent.instrumentSchema(executableSchema)
// app.use(OpticsAgent.middleware());

module.exports = function (request, result) {
  const token = request.headers.authorization || request.body.variables && request.body.variables.token;
  models.User.findByToken(token, (err, user) => {
    graphqlExpress((req, res) => {
      return {
        schema: executableSchema,
        context: {
          // opticsContext: OpticsAgent.context(req),
          currentUser: user,
        }
      }
    })(request, result)
  })
}
