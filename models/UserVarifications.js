const mongoose = require("mongoose")

const UserVarificationSchema = new mongoose.Schema(
  {
    fname: { type: String, required: true, trim: true },
    lname: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    otp: { type: String },
    phone: { type: String, trim: true },
    cCode: { type: String },
    avatar: { type: String },
    username: { type: String, unique: true },
    dob: { type: Date },
    retry: { type: Number, default: 1 }
  },
  { timestamps: true }
)
module.exports = mongoose.model("userverifications", UserVarificationSchema)
