const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    // lname: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, trim: true },
    cCode: { type: String },
    coin: { type: Number },
    avatar: { type: String },
    otp: { type: Number },
    appOpenDay: { type: Number },
    // dob: { type: Date },
    resetDayCollectWise: { type: Number },
    resetPasswordToken: { type: String },
    resetPasswordTokenExpiry: { type: Number },
    scratch: { type: Number },
    spin: { type: Number },
    isFirstTimeLogin: { type: Boolean, default: true }
  },
  { timestamps: true }
)

module.exports = mongoose.model("users", UserSchema)
