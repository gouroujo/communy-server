const { Schema } = require('mongoose');
const { values } = require('lodash')
const { roles } = require('dict');

const RegistrationSchema = new Schema({
  user: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fullname: {
      type: String,
      trim: true,
      index: true
    },
  },
  organisation: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'Organisation',
      required: true,
    },
    title:  {
      type: String,
      required: true,
      trim: true,
    },
  },
  network: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'Organisation',
      index: true,
      sparse: true,
    },
    title:  {
      type: String,
      trim: true,
    },
  },
  demo: Boolean,
  confirm: {
    type: Boolean,
    default: false,
    required: true
  },
  ack: {
    type: Boolean,
    default: false,
    required: true
  },
  role: {
    type: String,
    enum: values(roles).concat([null]),
    default: null
  },
  // activities: [],
}, {
  timestamps: true
});

RegistrationSchema.index({ 'user._id': 1, 'organisation._id': 1 }, { unique: true });

module.exports = RegistrationSchema;
