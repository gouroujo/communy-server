const { Schema } = require('mongoose');
const { values } = require('lodash')
const { orgStatus } = require('../config');

// const OrganisationEventSchema = new Schema({
//   title: String,
//   startTime: Date,
//   endTime: Date,
//   ref: { type: Schema.Types.ObjectId, ref: 'Event' }
// });

const OrganisationUserSchema = new Schema({
  firstname: String,
  lastname: String,
  email: String,
  avatar: String,
  role: {
    type: String,
    enum: values(orgStatus),
    index: true
  }, // status
  t: Date,
  ref: { type: Schema.Types.ObjectId, ref: 'User', index: true }
});

const OrganisationWtAckUserSchema = new Schema({
  firstname: String,
  lastname: String,
  email: String,
  avatar: String,
  ref: { type: Schema.Types.ObjectId, ref: 'User', index: true }
});

const OrganisationWtConfirmUserSchema = new Schema({
  firstname: String,
  lastname: String,
  email: String,
  avatar: String,
  ref: { type: Schema.Types.ObjectId, ref: 'User', index: true }
});

const OrganisationSchema = new Schema({
  title:  String,
  description: String,
  logo: String,
  cover: String,
  secret: { type: Number, default: false, index: true },
  nusers: { type: Number, default: 0 },
  nevents: { type: Number, default: 0 },
  nwt_confirm: { type: Number, default: 0 },
  nwt_ack: { type: Number, default: 0 },
  // events: [OrganisationEventSchema],
  users: [OrganisationUserSchema],
  wt_confirm: [OrganisationWtConfirmUserSchema],
  wt_ack: [OrganisationWtAckUserSchema],
});

module.exports = OrganisationSchema;
