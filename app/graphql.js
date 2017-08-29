const bodyParser = require('body-parser');
const compression = require('compression');
const fs = require('fs');

const { graphqlExpress, graphiqlExpress } = require('graphql-server-express');
const { makeExecutableSchema } = require('graphql-tools');
const OpticsAgent = require('optics-agent');

const config = require('./config');
const { models } = require('./db');

const Root = fs.readFileSync(__dirname + '/graphs/root.graphql', { encoding: 'utf8'});

const Address = fs.readFileSync(__dirname + '/graphs/address.graphql', { encoding: 'utf8'});
const Event = fs.readFileSync(__dirname + '/graphs/event.graphql', { encoding: 'utf8'});
const Organisation = fs.readFileSync(__dirname + '/graphs/organisation.graphql', { encoding: 'utf8'});
const User = fs.readFileSync(__dirname + '/graphs/user.graphql', { encoding: 'utf8'});

const resolvers = require('./resolvers');


module.exports = (app) => {

  const executableSchema = makeExecutableSchema({
    typeDefs: [
      Root,
      Address,
      Event,
      Organisation,
      User,
    ],
    resolvers: resolvers,
  });

  // GraphQL Optics
  OpticsAgent.instrumentSchema(executableSchema)
  app.use(OpticsAgent.middleware());

  const userAuth = (req, res, next) => {
    const token = req.headers.authorization || req.body.variables && req.body.variables.token;
    if (!token) return next();

    return models.User.findByToken(token)
      .then(user => {
        res.locals.user = user;
        return next();
      })
      .catch(e => {

        console.log(e);
        return res.sendStatus(401);
      })
  }

  app.use(config.ENDPOINT_URL,
    compression(),
    bodyParser.json(),
    userAuth,
    graphqlExpress((req, res) => {
      return {
        schema: executableSchema,
        context: {
          opticsContext: OpticsAgent.context(req),
          currentUser: res.locals.user,
        }
      }
    })
  );

  if (config.GRAPHIQL) {
    app.use('/graphiql', graphiqlExpress({
      endpointURL: config.ENDPOINT_URL,
    }));
  }
}
