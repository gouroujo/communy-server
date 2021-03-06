const { Schema } = require('mongoose');

const OrganisationSchema = new Schema({
  title:  {
    type: String,
    required: true,
    trim: true,
  },
  description: String,
  cover: Number,
  logo: Number,
  categories: {
    type: [String],
    index: true,
  },
  type: {
    type: String,
    enum: ['public', 'private', 'secret'],
    default: 'private',
    index: true,
    required: true
  },
  nnetworks: { type: Number, default: 0, required: true },
  demo: Boolean,
  nusers: { type: Number, default: 0, required: true },
  nevents: { type: Number, default: 0 , required: true},
  nwt_confirm: { type: Number, default: 0, required: true },
  nwt_ack: { type: Number, default: 0, required: true },
}, {
  timestamps: true
});

module.exports = OrganisationSchema;
