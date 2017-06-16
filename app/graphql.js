const bodyParser = require('body-parser');
const fs = require('fs');
const { graphqlExpress, graphiqlExpress } = require('graphql-server-express');
const { makeExecutableSchema } = require('graphql-tools');

const config = require('./config');
const { models } = require('./db');

const Root = fs.readFileSync(__dirname + '/graphs/root.graphql', { encoding: 'utf8'});

const Address = fs.readFileSync(__dirname + '/graphs/address.graphql', { encoding: 'utf8'});
const Event = fs.readFileSync(__dirname + '/graphs/event.graphql', { encoding: 'utf8'});
const Organisation = fs.readFileSync(__dirname + '/graphs/organisation.graphql', { encoding: 'utf8'});
const User = fs.readFileSync(__dirname + '/graphs/user.graphql', { encoding: 'utf8'});

const resolvers = require('./resolvers');

const { checkOrgPermission } = require('./permissions');

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

  const userAuth = (req, res, next) => {
    if (!req.headers.authorization) return next();

    return models.User.findByToken(req.headers.authorization)
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
    bodyParser.json(),
    userAuth,
    graphqlExpress((req, res) => {
      return {
        schema: executableSchema,
        context: {
          currentUser: res.locals.user,
          checkOrgPermission: checkOrgPermission
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
