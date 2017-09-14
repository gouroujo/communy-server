const { Schema } = require('mongoose');
const { values } = require('lodash')
const { orgStatus } = require('../dict');

const RegistrationSchema = new Schema({
  user: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    firstname: String,
    lastname: String,
    email: { type: String, required: true },
    avatar: String,
  },
  organisation: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'Organisation',
      required: true,
    },
    title:  { type: String, required: true },
    logo: String,
  },
  confirm: { type: Boolean, default: false, required: true },
  ack: { type: Boolean, default: false, required: true },
  role: {
    type: String,
    enum: values(orgStatus).concat([null]),
    default: null
  },
  // activities: [],
}, {
  timestamps: true
});

RegistrationSchema.index({ 'user._id': 1, 'organisation._id': 1 }, { unique: true });

module.exports = RegistrationSchema;
