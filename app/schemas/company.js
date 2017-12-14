const { Schema } = require('mongoose');
const AddressSchema = require('./address');

const CompanySchema = new Schema({
  title:  {
    type: String,
    required: true,
    trim: true,
  },
  description: String,
  cover: Number,
  logo: Number,
  address: AddressSchema,
  demo: Boolean,
  nusers: { type: Number, default: 0, required: true },
  ncommunities: { type: Number, default: 0, required: true },
  nusers_wt_ack: { type: Number, default: 0, required: true },
  ncommunities_wt_ack: { type: Number, default: 0, required: true },
}, {
  timestamps: true
});

module.exports = CompanySchema;
