const { graphqlExpress } = require('graphql-server-express');
const { makeExecutableSchema } = require('graphql-tools');
const OpticsAgent = require('optics-agent');
const { verify } = require('jsonwebtoken');

const config = require('./config');
const createLoaders = require('./loaders');
const verifyAsync = require('util').promisify(verify);

const executableSchema = makeExecutableSchema({
  typeDefs: [
    require('./graphs/root.graphql'),
    require('./graphs/address.graphql'),
    require('./graphs/event.graphql'),
    require('./graphs/organisation.graphql'),
    require('./graphs/user.graphql'),
    require('./graphs/registration.graphql'),
    require('./graphs/mailing.graphql'),
    require('./graphs/message.graphql'),
  ],
  resolvers: require('./resolvers'),
});

if (config.get('OPTICS_API_KEY')) {
  OpticsAgent.instrumentSchema(executableSchema)
}

module.exports = graphqlExpress((req, res) => {
  const loaders = createLoaders(res.locals.userId)
  return {
    schema: executableSchema,
    context: {
      opticsContext: config.get('OPTICS_API_KEY') ? OpticsAgent.context(req) : null,
      currentUserId: res.locals.userId,
      auth: res.locals.auth,
      loaders: loaders,
      language: req.acceptsLanguages(['fr', 'en']),
      getField: (fieldName, parent, loader) => {
        if (parent[fieldName]) return Promise.resolve(parent[fieldName]);
        return loaders[loader].load(parent._id)
          .then(loaded => loaded[fieldName])
          .catch(e => {
            console.log(e);
            return null
          })
      },
      // formatError: err => {
      //   if (err.originalError && err.originalError.data && err.originalError.data.statusCode) {
      //     res.status(err.originalError.data.statusCode);
      //   }
      //   return formatError(err)
      // }
    }
  }
})
