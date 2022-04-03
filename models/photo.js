var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var PhotoSchema = new Schema({
  name: { type: String },
  sort: { type: Number },
  user: { type: Schema.ObjectId, ref: 'User' },
});


// Export model.
module.exports = mongoose.model('Photo', PhotoSchema);