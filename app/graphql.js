const { graphqlExpress } = require('graphql-server-express');
const { makeExecutableSchema } = require('graphql-tools');

const config = require('config');
const createLoaders = require('loaders');
const db = require('db');
const logger = require('logger');

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
    require('./graphs/network.graphql'),
    require('./graphs/membership.graphql'),
    require('./graphs/partnership.graphql'),

  ],
  resolvers: require('./resolvers'),
});

module.exports = graphqlExpress((req, res) => {
  const loaders = createLoaders(res.locals.userId)
  return {
    schema: executableSchema,
    tracing: true,
    cacheControl: true,
    context: {
      res,
      logger: logger,
      config: config,
      models: db.models,
      currentUserId: res.locals.userId,
      auth: res.locals.auth,
      loaders: loaders,
      hostname: req.hostname,
      language: req.acceptsLanguages(['fr', 'en']),
      getField: (fieldName, parent, loader) => {
        return (parent[fieldName] ? Promise.resolve(parent) : loaders[loader].load(parent._id))
          .then(loaded => loaded[fieldName])
          .then(field => {
            if (!parent.demo) return field;
            if (field && typeof field === 'object') return Object.assign(field, { demo: true })
            return field;
          })
          .catch(e => {
            logger.error(`Error in getField (field: ${fieldName}, loader: ${loader}) : ${e.message}`, parent);
            return null
          })
      },

      // formatError: err => {
      //   if (err.originalError && err.originalError.data && err.originalError.data.statusCode) {
      //     res.status(err.originalError.data.statusCode);
      //   }
      //   return formatError(err)
      // }
    },
  }
})
