const { merge } = require('lodash');

const { GraphQLScalarType } = require('graphql');

const { GraphQLDate, GraphQLTime, GraphQLDateTime} = require('graphql-iso-date');

const { roles, answers } = require('dict');

const event = require('./Event');
const organisation = require('./Organisation');
const user = require('./User');
const registration = require('./registration');
const mailing = require('./mailing');
const message = require('./message');
const participation = require('./participation');
const network = require('./Network');
const membership = require('./membership');
const partnership = require('./partnership');

const index = {
  Date: GraphQLDate,
  Time: GraphQLTime,
  DateTime: GraphQLDateTime,
  // OrganisationRole: new GraphQLEnumType({
  //   name: 'OrganisationStatus',
  //   description: 'User registration role in an organisation (enum)',
  //   values: Object.keys(roles).reduce((acc, key) => Object.assign(acc, { [key]: { value: roles[key] } } ), {}),
  // }),
  OrganisationRole: new GraphQLScalarType({
    name: 'OrganisationRole',
    description: 'User registration role in an organisation (enum)',
    serialize(value) {
      const result = Object.keys(roles).find(v => roles[v] === value);
      return result || null;
    },
    parseValue(value) {
      return roles[value] || null;
    },
    parseLiteral(ast) {
      if (roles[ast.value]) return roles[ast.value];
      return null;
    }
  }),
  EventAnswer: new GraphQLScalarType({
    name: 'EventAnswer',
    description: 'User participation answer to an event (enum)',
    serialize(value) {
      const result = Object.keys(answers).find(v => answers[v] === value);
      return result || null;
    },
    parseValue(value) {
      return answers[value] || null;
    },
    parseLiteral(ast) {
      if (answers[ast.value]) return answers[ast.value];
      return null;
    }
    // values: Object.keys(answers).reduce((acc, key) => Object.assign(acc, { [key]: { value: answers[key] } } ), {}),
  }),
  Query: {
    version: () => '0.0.1',
  },
  Mutation: {
    version: () => '0.0.1',
  }
};

module.exports = merge(index, event, organisation, user, registration, mailing, message, participation, network, partnership, membership);
