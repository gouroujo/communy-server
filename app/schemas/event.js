const { Schema } = require('mongoose');
const AddressSchema = require('./address');

const SubUserSchema = new Schema({
  firstname: String,
  lastname: String,
  email: String,
  avatar: String,
  ref: { type: Schema.Types.ObjectId, index: true, sparse: true} // user id
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
  nusers: { type: Number, default: 0 },
  yes: [SubUserSchema],
  mb: [SubUserSchema],
  no: [SubUserSchema],
  address: AddressSchema,
});

module.exports = EventSchema;
