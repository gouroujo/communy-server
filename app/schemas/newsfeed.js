const { Schema } = require('mongoose');

const SubOrganisationSchema = new Schema({
  author: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    fullname:  {
      type: String,
      required: true,
      trim: true,
    },
  },
  date: {
    type: Date,
    required: true,
    default: Date.now()
  },
  type: {
    type: String,
    required: true,
  },
  data: {
    type: Object,
    default: {},
    required: true
  }
});

const NewsfeedSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  organisationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organisation',
  },
  eventId: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
  },
  bucket: {
    type: Number,
    default: 0,
  },
  count: {
    type: Number,
    default: 0,
  },
  activities: [SubOrganisationSchema]
}, {
  timestamps: true
});

NewsfeedSchema.index({ 'userId': 1, 'bucket': 1 }, { partialFilterExpression: { userId: { $exists: true } } });
NewsfeedSchema.index({ 'organisationId': 1, 'bucket': 1 }, { partialFilterExpression: { organisationId: { $exists: true } } });
NewsfeedSchema.index({ 'eventId': 1, 'bucket': 1 }, { partialFilterExpression: { eventId: { $exists: true } } });

module.exports = NewsfeedSchema;
