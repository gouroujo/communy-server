const { graphqlExpress } = require('graphql-server-express');
const { makeExecutableSchema } = require('graphql-tools');
// const OpticsAgent = require('optics-agent');

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

// if (config.get('OPTICS_API_KEY')) {
//   OpticsAgent.instrumentSchema(executableSchema)
// }

module.exports = graphqlExpress((req, res) => {
  const loaders = createLoaders(res.locals.userId)
  return {
    schema: executableSchema,
    context: {
      res,
      // opticsContext: config.get('OPTICS_API_KEY') ? OpticsAgent.context(req) : null,
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
            if (typeof field === 'object') return Object.assign(field, { demo: true })
            return field;
          })
          .catch(e => {
            logger.error(e);
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
