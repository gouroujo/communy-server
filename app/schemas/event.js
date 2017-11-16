const { Schema } = require('mongoose');
const AddressSchema = require('./address');

const SubNetworkSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId,
    ref: 'Network',
    required: true,
  },
  title:  {
    type: String,
    required: true,
    trim: true,
  },
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
  networks: [SubNetworkSchema],
  demo: Boolean,
  nanswers: { type: Number, default: 0 },
  nyes: { type: Number, default: 0 },
  nno: { type: Number, default: 0 },
  nmb: { type: Number, default: 0 },
  address: AddressSchema,
});

module.exports = EventSchema;
