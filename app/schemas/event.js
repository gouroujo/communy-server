const { Schema } = require('mongoose');
const AddressSchema = require('./address');

const SubUserSchema = new Schema({
  fn: String, // user Fullname
  av: String, // user avatarUrl
  ref: { type: Schema.Types.ObjectId, unique: true} // user id
});

const EventSchema = new Schema({
  title:  String,
  description: String,
  startTime: { type: Date, index: true },
  endTime: { type: Date, index: true },
  allDay: Boolean,
  organisation: {
    ref: Schema.Types.ObjectId,
    title: String,
    logo: String,
  },
  nusers: Number,
  yes: [SubUserSchema],
  maybe: [SubUserSchema],
  no: [SubUserSchema],
  address: AddressSchema,
});

module.exports = EventSchema;
