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
  demo: Boolean,
  nanswers: { type: Number, default: 0 },
  nyes: { type: Number, default: 0 },
  nno: { type: Number, default: 0 },
  nmb: { type: Number, default: 0 },
  address: AddressSchema,
});

module.exports = EventSchema;
