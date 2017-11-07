const { Schema } = require('mongoose');

const AnswerSchema = new Schema({
  user: {
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
  body: String
});

const SubMailingSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId,
    ref: 'Mailing',
    required: true,
  },
  organisation: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'Organisation',
      required: true,
    },
    title:  { type: String, required: true },
  },
}, { _id: false})

const MessageSchema = new Schema({
  to: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fullname: {
      type: String,
      trim: true,
    },
    email: String,
    phone: String,
  },
  mailing: SubMailingSchema,
  readAt: Date,
  sentAt: Date,
  body: String,
  subject: String,
  answers: [AnswerSchema]
}, {});

MessageSchema.index({ 'to._id': 1, 'organisation._id': 1 });

module.exports = MessageSchema;
