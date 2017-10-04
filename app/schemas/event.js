const { Schema } = require('mongoose');
const AddressSchema = require('./address');

const SubUserSchema = new Schema({
  firstname: String,
  lastname: String,
  email: String,
  _id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  } // user id
});

const EventSchema = new Schema({
  title:  String,
  description: String,
  startTime: { type: Date, index: true },
  endTime: { type: Date, index: true },
  allDay: Boolean,
  organisation: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'Organisation',
      required: true,
      index: true,
    },
    title: String,
  },
  nusers: { type: Number, default: 0 },
  yes: [SubUserSchema],
  mb: [SubUserSchema],
  no: [SubUserSchema],
  address: AddressSchema,
});

module.exports = EventSchema;
