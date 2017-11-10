const { Schema } = require('mongoose');

const NetworkSchema = new Schema({
  title:  {
    type: String,
    required: true,
    trim: true,
  },
  description: String,
  cover: Number,
  logo: Number,
  type: {
    type: String,
    enum: ['public', 'private', 'secret'],
    default: 'private',
    index: true,
    required: true
  },
  demo: Boolean,
  nusers: { type: Number, default: 0, required: true },
  norganisations: { type: Number, default: 0, required: true },
}, {
  timestamps: true
});

module.exports = NetworkSchema;
