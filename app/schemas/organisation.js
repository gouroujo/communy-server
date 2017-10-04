const { Schema } = require('mongoose');
const { values } = require('lodash')
const { orgStatus } = require('../dict');

const OrganisationSchema = new Schema({
  title:  { type: String, required: true },
  description: String,
  cover: Number,
  logo: Number,
  secret: { type: Number, default: false, index: true, required: true },
  nusers: { type: Number, default: 0, required: true },
  nevents: { type: Number, default: 0 , required: true},
  nwt_confirm: { type: Number, default: 0, required: true },
  nwt_ack: { type: Number, default: 0, required: true },
}, {
  timestamps: true
});

module.exports = OrganisationSchema;
