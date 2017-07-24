const { Schema } = require('mongoose');
const { values } = require('lodash')
const { orgStatus } = require('../config');

const RegistrationSchema = new Schema({
  user: {
    id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    fullname: String,
    avatar: String,
  },
  organisation: {
    id: {
      type: Schema.Types.ObjectId,
      ref: 'Organisation',
    },
    title:  String,
    logo: String,
  },
  status: {
    type: String,
    enum: values(orgStatus),
    index: true
  },
  activities: [],
});

RegistrationSchema.index({ 'user.id': 1, 'organisation.id': 1 }, { unique: true });

module.exports = RegistrationSchema;
