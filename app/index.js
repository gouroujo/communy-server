const express = require('express');
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const config = require('./config');
const db = require('./db');

// Authentication middleware. When used, the
// access token must exist and be verified against
// the Auth0 JSON Web Key Set
const checkJwt = jwt({
  // Dynamically provide a signing key
  // based on the kid in the header and
  // the singing keys provided by the JWKS endpoint.
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://orgaa.eu.auth0.com/.well-known/jwks.json`
  }),

  // Validate the audience and the issuer.
  audience: '{API_ID}',
  issuer: `https://orgaa.eu.auth0.com/`,
  algorithms: ['RS256']
});


const connection = db.mongoose.connection;
const app = express();

require('./graphql')(app);
require('./auth')(app);
// app.use(checkJwt)

connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', function() {
  app.listen(config.PORT);
  console.log('Running a GraphQL API server at localhost:' + config.PORT + '/graphql');
});
