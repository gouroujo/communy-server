const { Schema } = require('mongoose');

const AddressSchema = new Schema({
  title:  String,
  street: String,
  zipcode: String,
  city: String,
  country: String,
  lat: Number,
  lng: Number,
});

module.exports = AddressSchema;
