const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// make a schema having name, photo , password,passwordConfirm
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a vallid email'],
  },
  photo: {type:String,
  default:'default.jpg'},
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on create and SAVE!!!
      validator: function (el) {
        return el === this.password; // abs === abs then only it works.
      },
      message: 'Passwords are not the same!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  // for delete the user we need to add property in our schema.
  active:{
type:Boolean,
default:true,
select:false
  }
});

userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified.
  if (!this.isModified('password')) return next(); 
    // hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    // after passwordConfirm vallidation we don't need to save passwordConfirm in our databse that's why we define it as undefined.
    this.passwordConfirm = undefined; // Delete the password confirm field.
    next();
    // if different user put same password then in our database it in different in the form of bcrypt js.
  
});
userSchema.pre('save',function(next){
  if (!this.isModified('password') || this.isNew) return next(); 

  this.passwordChangedAt = Date.now()-1000;
  next();
})

userSchema.pre(/^find/,function(next){
// this points to the current querry
this.find({active:{$ne:false}});
next();
});

userSchema.methods.correctPassword = async function (
  condidatePassword,
  userPassword
) {
  // userPassword-->hash Password and condidatePassword -->original password without hash
  return await bcrypt.compare(condidatePassword, userPassword);
};
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp; // (100-->time at which token was issued) < (200-->time of change password)
  }

  // if this.passwordChangedAt does not exist then it means user never change their password. That's why we return false;
  return false;
};
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    console.log({resetToken},this.passwordResetToken)
    this.passwordResetExpires= Date.now() + 10 * 60 * 1000;

    return resetToken;
};

const User = new mongoose.model('User', userSchema);
module.exports = User;
