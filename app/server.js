const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const compression = require('compression');
const { graphiqlExpress } = require('graphql-server-express');

const config = require('./config');
const db = require('./db');

const graphQL = require('./index').graphql;

const connection = db.mongoose.connection;
const app = express();

app.set('trust proxy', 1);
app.use(helmet());

app.use(config.ENDPOINT_URL,
  bodyParser.json(),
  graphQL);

if (config.GRAPHIQL) {
  app.use('/graphiql', graphiqlExpress({
    endpointURL: config.ENDPOINT_URL,
  }));
}


app.use('/oauth', bodyParser.json(), require('./auth/oauth'));
app.use('/confirm', bodyParser.json(), require('./auth/confirm'));
app.use('/login', bodyParser.json(), require('./auth/login'));
app.use('/recover', bodyParser.json(), require('./auth/recover'));
app.use('/reset', bodyParser.json(), require('./auth/reset'));
app.use('/signin', bodyParser.json(), require('./auth/signin'));

connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', function() {
  app.listen(config.PORT);
  console.log('Running a GraphQL API server at localhost:' + config.PORT + '/graphql');
});
