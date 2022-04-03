var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const MatchType = {
  UNMATCH: 0,
  MATCH: 1,
  WAIT: 2,
};

var MatchSchema = new Schema({
  owner: { type: Schema.ObjectId, ref: 'User' },
  match: { type: Number, default: MatchType },
  other: { type: Schema.ObjectId, ref: 'User' },
});

// MatchSchema.virtual('user').get(function () {
//   return this.other == null ? this.owner : this.other;
// });

// Export model.
module.exports = mongoose.model('Match', MatchSchema);