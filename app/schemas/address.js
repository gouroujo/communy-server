const { Schema } = require('mongoose');

const LocationSchema = new Schema({
  type: String,
  coordinates: [Number] // [<longitude>, <latitude>]
}, { typeKey: '$type' })

const AddressSchema = new Schema({
  title:  String,
  fulltext: String,
  road: String,
  postcode: String,
  city: String,
  country: String,
  country_code: String,
  location: {
    type: LocationSchema,
    default: null,
  },
});

AddressSchema.index({ location: '2dsphere' }, { background: true, sparse: true });
module.exports = AddressSchema;
