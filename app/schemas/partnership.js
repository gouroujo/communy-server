const { Schema } = require('mongoose');

const PartnershipSchema = new Schema({
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
  company: {
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
  ack: {
    type: Boolean,
    default: false,
    required: true
  },
}, {
  timestamps: true
});

PartnershipSchema.index({ 'organisation._id': 1, 'company._id': 1 }, { unique: true });

module.exports = PartnershipSchema;
