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
}, { _id: false });

const EventSchema = new Schema({
  uid: {
    type: Schema.Types.ObjectId,
    inde: true,
  },
  number: Number,
  title:  String,
  description: String,
  startTime: { type: Date, index: true, required: true },
  endTime: { type: Date, index: true, required: true },
  allDay: Boolean,
  organisation: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'Organisation',
      required: true,
      index: true,
    },
    title: String,
    cover: Number,
  },
  participation_level: {
    type: Number,
    index: true,
    required: true,
    default: 4, // open to all - confirm for public - closed for public (0,1,2) / network (3,4) / members(5,6) ,
  },
  visibility_level: {
    type: Number,
    index: true,
    required: true,
    default: 0, //visible for all / network / member
  },
  open: {
    type: Boolean,
    default: true
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
