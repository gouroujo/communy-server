const { merge } = require('lodash');

const { GraphQLScalarType } = require('graphql');
const { Kind } =  require('graphql/language');

const { GraphQLDate, GraphQLTime, GraphQLDateTime} = require('graphql-iso-date');

const { orgStatus, eventStatus } = require('../config');

const event = require('./event');
const organisation = require('./organisation');
const user = require('./user');
const registration = require('./registration');

const index = {
  Date: GraphQLDate,
  Time: GraphQLTime,
  DateTime: GraphQLDateTime,
  // OrganisationRole: new GraphQLEnumType({
  //   name: 'OrganisationStatus',
  //   description: 'User registration role in an organisation (enum)',
  //   values: Object.keys(orgStatus).reduce((acc, key) => Object.assign(acc, { [key]: { value: orgStatus[key] } } ), {}),
  // }),
  OrganisationRole: new GraphQLScalarType({
    name: 'OrganisationRole',
    description: 'User registration role in an organisation (enum)',
    serialize(value) {
      const result = Object.keys(orgStatus).find(v => orgStatus[v] === value);
      return result || null;
    },
    parseValue(value) {
      return orgStatus[value] || null;
    },
    parseLiteral(ast) {
      if (orgStatus[ast.value]) return orgStatus[ast.value];
      return null;
    }
  }),
  EventAnswer: new GraphQLScalarType({
    name: 'EventAnswer',
    description: 'User participation answer to an event (enum)',
    serialize(value) {
      const result = Object.keys(eventStatus).find(v => eventStatus[v] === value);
      return result || null;
    },
    parseValue(value) {
      return eventStatus[value] || null;
    },
    parseLiteral(ast) {
      if (eventStatus[ast.value]) return eventStatus[ast.value];
      return null;
    }
    // values: Object.keys(eventStatus).reduce((acc, key) => Object.assign(acc, { [key]: { value: eventStatus[key] } } ), {}),
  }),
  Query: {
    version: () => '0.0.1',
    isAuthenticated: (parent, args, { currentUser }) => !!currentUser,
  },
  Mutation: {
    version: () => '0.0.1',
  }
};

module.exports = merge(index, event, organisation, user, registration);
