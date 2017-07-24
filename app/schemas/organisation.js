const { Schema } = require('mongoose');
const { values } = require('lodash')
const { orgStatus } = require('../config');

const OrganisationEventSchema = new Schema({
  title: String,
  startTime: Date,
  endTime: Date,
  ref: { type: Schema.Types.ObjectId, ref: 'Event' }
});

const OrganisationUserSchema = new Schema({
  fullname: String,
  name: String,
  avatar: String,
  role: String,
  ref: { type: Schema.Types.ObjectId, ref: 'User'}
});

const OrganisationSchema = new Schema({
  title:  String,
  description: String,
  logo: String,
  cover: String,
  nusers: Number,
  nevents: Number,
  events: [OrganisationEventSchema],
  users: [OrganisationUserSchema],
  wt_confirm: [OrganisationUserSchema],
  wt_ack: [OrganisationUserSchema],
});

module.exports = OrganisationSchema;
