const { graphqlExpress } = require('graphql-server-express');
const { makeExecutableSchema } = require('graphql-tools');
const DataLoader = require('dataloader');
const OpticsAgent = require('optics-agent');
const config = require('./config');
const { verify } = require('jsonwebtoken');
const { mongoose, models } = require('./db');

// const memcached = require('./memcached');
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

function createLoaderFor(model, options) {
  return new DataLoader(ids => {
    const castedIds = ids
      .map(id => mongoose.Types.ObjectId(id))
    return model.aggregate([
      {$match: {_id: {$in: castedIds}}},
      {$addFields: {"__order": {$indexOfArray: [castedIds, "$_id" ]}}},
      {$sort: {"__order": 1}}
    ])
  }, options)
}

function createLoaders() {
  return {
    Event: createLoaderFor(models.Event),
    Organisation: createLoaderFor(models.Organisation),
    Registration: createLoaderFor(models.Registration),
    RegistrationLink: new DataLoader(([ params ]) => {
      return models.Registration.findOne(params)
        .then(registration => Promise.resolve([ registration ]))
    }, { batch: false, cacheKeyFn: key => String(key["organisation._id"])+':'+String(key["user._id"]) }),
    Message: createLoaderFor(models.Message),
    Mailing: createLoaderFor(models.Mailing),
    User: new DataLoader(id => {
      return models.User.findById(id)
        .then(user => {
          return Promise.resolve([ user ])
          // return memcached.set(id, user.toObject(), config.get('USER_CACHE_LIFETIME'))
          // .then(() => Promise.resolve([ user ]))
        })
    }, { batch: false, cacheKeyFn: key => String(key) }),
  }
}

module.exports = function (request, result) {
  const loaders = createLoaders();
  const token = request.headers.authorization || request.body.variables && request.body.variables.token;
  return Promise.resolve()
  .then(() => {
    if (!token) return null;
    return verifyAsync(token, config.get('SECRET'))
  })
  .then(payload => {
    if (!payload) return null;
    return loaders.User.load(payload.id);
    // return memcached.get(payload.id)
    //   .then(data => {
    //     if (data) {
    //       return memcached.touch(payload.id, config.get('USER_CACHE_LIFETIME'))
    //         .then(() => new models.User(data))
    //     }
    //     return loaders.User.load(payload.id)
    //   })
  })
  .then(user => {
    return graphqlExpress((req, res) => {
      return {
        schema: executableSchema,
        context: {
          opticsContext: config.get('OPTICS_API_KEY') ? OpticsAgent.context(req) : null,
          currentUser: user,
          loaders,
          language: req.acceptsLanguages(['fr', 'en']),
          getField: (fieldName, parent, loader) => {
            if (parent[fieldName]) return Promise.resolve(parent[fieldName]);
            return loaders[loader].load(parent._id)
              .then(loaded => loaded[fieldName])
              .catch(e => {
                console.log(e);
                return null
              })
          }
        }
      }
    })(request, result)
  })
  .catch(e => {
    console.log(e);
    result.status(500).send(e.message)
  });
}
