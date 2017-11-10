const { Schema } = require('mongoose');
const { values } = require('lodash')
const { roles } = require('dict');

const MembershipSchema = new Schema({
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
  network: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'Network',
      required: true,
    },
    title:  { type: String },
  },
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
}, {
  timestamps: true
});

MembershipSchema.index({ 'user._id': 1, 'network._id': 1 }, { unique: true });

module.exports = MembershipSchema;
