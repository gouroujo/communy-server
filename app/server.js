const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const compression = require('compression');
const { graphiqlExpress } = require('graphql-server-express');
const OpticsAgent = require('optics-agent');

const config = require('./config');
const db = require('./db');

const connection = db.mongoose.connection;
const app = express();

app.set('trust proxy', 1);
app.use(helmet());

app.use(config.get('ENDPOINT_URL'),
  compression(),
  bodyParser.json(),
  OpticsAgent.middleware(),
  require('./graphql')
);

if (config.get('GRAPHIQL')) {
  app.use('/graphiql', graphiqlExpress({
    endpointURL: config.get('ENDPOINT_URL'),
  }));
}

app.use('/auth/*', bodyParser.json())
app.use('/auth/oauth', require('./auth/oauth'));
app.use('/auth/confirm', require('./auth/confirm'));
app.use('/auth/login', require('./auth/login'));
app.use('/auth/recover', require('./auth/recover'));
app.use('/auth/reset', require('./auth/reset'));
app.use('/auth/signin', require('./auth/signin'));
app.use('/auth/invite', require('./auth/invite'));

app.use('/admin/*', bodyParser.json());
app.use('/admin/createorg', require('./admin/join'));

connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', function() {
  app.listen(config.get('PORT'));
  console.log('Running a GraphQL API server at localhost:' + config.get('PORT') + '/graphql');
});
