const express = require('express');
const helmet = require('helmet');

const config = require('./config');
const db = require('./db');

const connection = db.mongoose.connection;
const app = express();

app.set('trust proxy', 1);
app.use(helmet());
require('./graphql')(app);
require('./auth')(app);

app.use('/health', (req, res) => {
  res.sendStatus(200);
});

connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', function() {
  app.listen(config.PORT);
  console.log('Running a GraphQL API server at localhost:' + config.PORT + '/graphql');
});
