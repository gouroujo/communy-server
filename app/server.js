const express = require('express');
const helmet = require('helmet');
var cors = require('cors')

const bodyParser = require('body-parser');
const compression = require('compression');
const { graphiqlExpress } = require('graphql-server-express');
const { Engine } = require('apollo-engine');

const AuthMiddleware = require('auth/middleware');
const config = require('config');
const db = require('db');
const logger = require('logger');

const engine = new Engine({
  engineConfig: {
    apiKey: config.get('ENGINE_API_KEY'),
  },
  graphqlPort: config.get('PORT'),
  endpoint: config.get('ENDPOINT_URL'),
})
const connection = db.mongoose.connection;
const app = express();

app.set('trust proxy', 1);
app.use(engine.expressMiddleware());
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', /https?:\/\/([a-z0-9]+[.])*communy.org/],
  allowedHeaders: ['Content-Type', 'Authorization'] ,
  optionsSuccessStatus: 200
}))
app.use(compression());

app.use(config.get('ENDPOINT_URL'),
  bodyParser.json(),
  AuthMiddleware(),
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
app.use('/auth/join', require('./auth/join'));

app.use('/admin/*', bodyParser.json());
// app.use('/admin/createorg', require('./admin/join'));
app.use('/admin/createorg', require('./admin/create'));
app.use('/admin/demo', require('./admin/demo'));
app.use('/admin/migration', require('./admin/migration'));

if (config.get('ENGINE_API_KEY')) {
  engine.start()
}

connection.once('open', function() {
  app.listen(config.get('PORT'));
  logger.info('Running a GraphQL API server at localhost:' + config.get('PORT') + '/graphql')
});

const terminate = () => {
  db.mongoose.disconnect(err => {
    logger.info(`Server shutdown: ${err || 'No error'}`)
    process.exit(err ? 1 : 0);
  })
}
process.once('SIGTERM', terminate);
process.on('SIGINT', terminate);
