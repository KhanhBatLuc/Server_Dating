var mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const DATE_DIFF = require("date-diff-js");
const util = require('../utils/utils')

const salt = 10;

var Schema = mongoose.Schema;

var UserSchema = new Schema({
  name: { type: String },
  email: { type: String },
  password: { type: String },
  sex: { type: String, enum: ['Nam', 'Nữ'], default: 'Nam' },
  birth: { type: Date },
  job: { type: String },
  company: { type: String },
  school: { type: String },
  address: { type: String },
  company: { type: String },
  height: { type: String },
  weight: { type: String },
  literacy: { type: String },
  description: { type: String },
  bio: { type: String },
  country: { type: String },
  latitude: { type: String },
  longitude: { type: String },

  interests: [String],
  preferSex: { type: String },
  interestDistance: { type: String },
  interestAgeMin: { type: String },
  interestAgeMax: { type: String },
  interestHeight: { type: String },
  interestWeight: { type: String },
  interestLiteracy: { type: String },



  alertMatch: { type: Boolean, default: true },
  alertMessage: { type: Boolean, default: true },
  alertLiked: { type: Boolean, default: true },
  displayAge: { type: Boolean, default: true },
  displayDistance: { type: Boolean, default: true },


  // user fire base token in app
  fcm_key: { type: String, default: null, trim: true },
  // check if user blocked or not
  blocked: { type: Boolean, default: false },
  //mobile device name of user
  device_model: { type: String, trim: true, default: null },
  //user profile picture
  avatar: { type: String, default: 'user.png', trim: true },
  //get the last time that user was online
  last_seen: { type: Number, required: true, default: new Date().getTime() },
  // timestamp
  updated_at: { type: Number, required: true, default: new Date().getTime() },
  // timestamp
  created_at: { type: Number, required: true, default: new Date().getTime() },

},
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  });


// to signup a user
UserSchema.pre('save', function (next) {
  var user = this;

  if (user.isModified('password')) {
    bcrypt.genSalt(salt, function (err, salt) {
      if (err) return next(err);

      bcrypt.hash(user.password, salt, function (err, hash) {
        if (err) return next(err);
        user.password = hash;
        next();
      })

    })
  }
  else {
    next();
  }
});

//to login
UserSchema.methods.comparepassword = function (password, cb) {
  bcrypt.compare(password, this.password, function (err, isMatch) {
    if (err) return cb(next);
    cb(null, isMatch);
  });
}

UserSchema.virtual('age')
  .get(function () {
    return DATE_DIFF(new Date(), new Date(this.birth), 'Y').outputs.years;
  });

UserSchema.virtual('get_last_seen')
  .get(function () {
    return util.lastTime(this.last_seen)
  });


// Export model.
module.exports = mongoose.model('User', UserSchema);