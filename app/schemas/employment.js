const { Schema } = require('mongoose');
const { values } = require('lodash')
const { roles } = require('dict');

const EmploymentSchema = new Schema({
  user: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fullname:  {
      type: String,
      required: true,
      trim: true,
      index:true,
    },
  },
  company: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'Network',
      required: true,
    },
    title:  { type: String },
  },
  ack: {
    type: Boolean,
    default: false,
    required: true
  },
  deleted: {
    type: Boolean,
    default: false,
    required: true
  },
  role: {
    type: String,
    enum: values(roles).concat([null]),
    default: null
  },
}, {
  timestamps: true
});

EmploymentSchema.index({ 'user._id': 1, 'company._id': 1 }, { unique: true });

module.exports = EmploymentSchema;
