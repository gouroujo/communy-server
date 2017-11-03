const { Schema } = require('mongoose');

const MigrationSchema = new Schema({
  filename: {
    type: String,
    required: true,
    unique: true,
    index: true
  }
}, {
  timestamps: true
});


module.exports = MigrationSchema;
