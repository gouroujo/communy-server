const { Schema } = require('mongoose');

const MembershipSchema = new Schema({
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
      ref: 'Network',
      required: true,
    },
    title:  {
      type: String,
      required: true,
      trim: true,
    },
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
}, {
  timestamps: true
});

MembershipSchema.index({ 'organisation._id': 1, 'network._id': 1 }, { unique: true });

module.exports = MembershipSchema;
