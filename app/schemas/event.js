const { Schema } = require('mongoose');
const AddressSchema = require('./address');

const SubUserSchema = new Schema({
  fn: String, // user Fullname
  av: String, // user avatarUrl
  st: { type: String }, // status
  _id: { type: Schema.Types.ObjectId, unique: true} // user id
});

const EventSchema = new Schema({
  title:  String,
  description: String,
  startTime: { type: Date, index: true },
  endTime: { type: Date, index: true },
  organisation: {
    _id: Schema.Types.ObjectId,
    title: String,
    logoUrl: String,
  },
  users: [SubUserSchema],
  address: AddressSchema,
});

module.exports = EventSchema;
