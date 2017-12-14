const { Schema } = require('mongoose')
const { values } = require('lodash')
const { answers } = require('dict')

const ParticipationSchema = new Schema({
  user: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fullname: {
      type: String,
      trim: true,
      index: true
    },
  },
  event: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    title:  { type: String, required: true },
    startTime: { type: Date, index: true },
    endTime: { type: Date, index: true },
  },
  organisation: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'Organisation',
      required: true,
    },
    title:  {
      type: String,
      trim: true,
    },
    logo: Number,
  },
  demo: Boolean,
  confirm: Boolean,
  answer: {
    type: String,
    enum: values(answers).concat([null]),
    default: null,
    required: true,
  },
}, {
  timestamps: true
});

ParticipationSchema.index({ 'user._id': 1, 'answer': 1 }, { unique: false });
ParticipationSchema.index({ 'event._id': 1, 'answer': 1 }, { unique: false });
ParticipationSchema.index({ 'user._id': 1, 'event._id': 1 }, { unique: true });
ParticipationSchema.index({ 'user._id': 1, 'organisation._id': 1 }, { unique: false });

module.exports = ParticipationSchema;
