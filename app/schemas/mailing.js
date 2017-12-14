const { Schema } = require('mongoose');

const SubMessageSchema = new Schema({
  to: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fullname: {
      type: String,
      trim: true,
    },
  },
  _id: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
    required: true,
  }
}, { _id: false });

const MailingSchema = new Schema({
  organisation: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'Organisation',
      required: true,
    },
    title:  { type: String, required: true },
  },
  from: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fullname: {
      type: String,
      trim: true,
      index: true,
    },
  },
  body: String,
  subject: String,
  messages: [SubMessageSchema],
  sentAt: Date,
}, {
  timestamps: true
});

MailingSchema.index({'organisation._id': 1 });

module.exports = MailingSchema;
