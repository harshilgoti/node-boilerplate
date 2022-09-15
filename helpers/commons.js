const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const otpGenerater = require("otp-generator")
const uuid = require("uuid")
const crypto = require("crypto")

exports.JwtSign = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" })
}

exports.bcryptHash = (password) => {
  return bcrypt.hashSync(password, 10)
}
exports.AddTime = (time) => {
  let ut = new Date();
  ut.setSeconds(ut.getSeconds() + Number(time))
  return ut;
}

exports.bcryptCompare = (password, hash) => {
  return bcrypt.compareSync(password, hash)
}

exports.generateOTP = () => {
  return otpGenerater.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false })
}

exports.generateUuid = () => {
  return uuid.v4()
}

exports.generateRandomString = () => {
  return crypto.randomBytes(32).toString("hex")
}

exports.JoiParseError = (error) => {
  return error.details[0].message.replace(/[^a-zA-Z0-9 ]/g, "")
}
