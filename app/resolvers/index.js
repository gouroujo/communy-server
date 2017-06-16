const { merge } = require('lodash');

const { GraphQLEnumType } = require('graphql');
const { GraphQLDate, GraphQLTime, GraphQLDateTime} = require('graphql-iso-date');

const { orgStatus, eventStatus } = require('../config');

const event = require('./event');
const organisation = require('./organisation');
const user = require('./user');

const index = {
  Date: GraphQLDate,
  Time: GraphQLTime,
  DateTime: GraphQLDateTime,
  // OrganisationStatus: new GraphQLEnumType({
  //   name: 'OrganisationStatus',
  //   description: 'User registration status in organisation (enum)',
  //   values: orgStatus,
  // }),
  // EventStatus: new GraphQLEnumType({
  //   name: 'EventStatus',
  //   description: 'User participation status in event (enum)',
  //   values: eventStatus,
  // }),
  Query: {
    version: () => '0.0.1',
    isAuthenticated: (parent, args, { currentUser }) => !!currentUser
  },
  Mutation: {
    version: () => '0.0.1',
  }
};

module.exports = merge(index, event, organisation, user);
