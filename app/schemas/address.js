const { Schema } = require('mongoose');

const AddressSchema = new Schema({
  title:  String,
  fulltext: String,
  road: String,
  postcode: String,
  city: String,
  country: String,
  country_code: String,
  location: {
    type: String,
    coordinates: [Number], // [<longitude>, <latitude>]
  },
}, { typeKey: '$type' });

AddressSchema.index({ location: '2dsphere' }, { background: true });
module.exports = AddressSchema;
