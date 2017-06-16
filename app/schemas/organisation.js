const { Schema } = require('mongoose');
const { values } = require('lodash')
const { orgStatus } = require('../config');

const SubUserSchema = new Schema({
  fn: String, // user Fullname
  em: String, // user email
  av: String, // user avatarUrl
  st: {
    type: String,
    enum: values(orgStatus),
    index: true
  }, // status
  _id: { type: Schema.Types.ObjectId, unique: true}, // user id
  t: Date
});

const SubEventSchema = new Schema({
  title: String,
  startTime: Date,
  endTime: Date,
  _id: { type: Schema.Types.ObjectId, unique: true} // event id
});
// SubEventSchema.index({ endTime: 1}, { expireAfterSeconds: 0 }) // Expire after past

const OrganisationSchema = new Schema({
  title:  String,
  description: String,
  logoUrl: String,
  coverUrl: String,
  events: [SubEventSchema],
  users: [SubUserSchema],
});

module.exports = OrganisationSchema;
