const Joi = require("joi")
const fs = require("fs")
const logger = require("winston")
let schedule = require("node-schedule")
const db = require("./../utils/mongoose")
const response = require("./../utils/response")
const helpers = require("./../helpers")
let options = {
  errors: {
    escapeHtml: true,
    labels: true
  }
}

function validateUser(body) {
  let schema = Joi.object({
    fullName: Joi.string().required(),
    // lname: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    dob: Joi.date(),
    phone: Joi.string(),
    cCode: Joi.string(),
    avatar: Joi.string(),
    username: Joi.string()
  })
  return schema.validate(body, options)
}
function validateEditUserData(body) {
  let schema = Joi.object({
    fname: Joi.string().required(),
    lname: Joi.string().required(),
    dob: Joi.date(),
    phone: Joi.string(),
    cCode: Joi.string(),
    avatar: Joi.string(),
    username: Joi.string()
  })
  return schema.validate(body)
}

exports.login = async (req, res) => {
  try {
    let { userId, password } = req.body

    if (!(userId && password)) return res.send(response.validation("Fields Missing!"))

    let userObj = await db.findOne({ collection: "users", query: { $or: [{ email: userId }, { phone: userId }] } })
    if (!userObj) return res.send(response.error("email and password do not match", {}, 401))

    let isValid = helpers.bcryptCompare(password, userObj.password)
    if (isValid) {
      let payload = {
        _id: userObj._id,
        email: userObj.email,
        fname: userObj.fname,
        lname: userObj.lname,
        username: userObj.username,
        avatar: userObj.avatar
      }
      let token = helpers.JwtSign(payload);

      // let jobId = `USER:${userObj._id.toString()}`
      // console.log(" jobId => 0 ,", jobId);
      // schedule.cancelJob(jobId);
      // let turnExpireTimer = helpers.AddTime(10) //86400
      // schedule.scheduleJob(
      //   jobId,
      //   '*/5 * * * * *',
      //   async function () {
      //     console.log(" ===>> timer", userObj._id);
      //     await db.findOneAndUpdate({
      //       collection: "users",
      //       // query: { token },
      //       query: { _id: userObj._id },
      //       update: {
      //         $set: { scratch: 15, spin: 15 }
      //       }
      //     });
      //     // let userObj = await db.findOne({ collection: "users", query: { _id: userObj._id } })
      //     // if (!userObj.isFirstTimeLogin) res.send(response.success("update scratch and spin", { userObj }))
      //   }
      // )
      await db.findOneAndUpdate({
        collection: "users",
        // query: { token },
        query: { $or: [{ email: userId }, { phone: userId }] },
        update: {
          $set: { appOpenDay: 0, resetDayCollectWise: "", isFirstTimeLogin: false, scratch: 5, spin: 5 }
        }
      });
      let data = await db.findOne({ collection: "users", query: { $or: [{ email: userId }, { phone: userId }] } })

      return res.send(response.success("LoggedIn Successfullly", { token, spin: data.spin, scratch: data.scratch }))
    } else {
      return res.send(response.error("email and password do not match", {}, 401))
    }
  } catch (error) {
    logger.error(error)
    return res.send(response.error("Something Went Wrong!", error.message, 500))
  }
}

exports.addCoinInWallet = async (req, res) => {
  let userObj = await db.findOne({
    collection: "users",
    query: { _id: req.user._id },
    project: { coin: 1 }
  });

  if (!userObj) return res.send(response.error("User Not Found Please login or register!", {}, 404))
  console.log(" coin ", req.body.coin);
  let coins = userObj.coin + req.body.coin;
  console.log("user obj coin ", userObj.coin);
  console.log(" = coins ", coins);


  let spin = req.query.spin ? req.query.spin : "";
  console.log(" spin => ", spin);
  let scratch = req.query.scratch ? req.query.scratch : "";
  console.log(" scratch => ", scratch);

  // let data = await db.findByIdAndUpdate({ collection: "users", id: req.user._id, update: { $inc: { coin: req.body.coin } }, options: { upsert: true } });
  if (spin) {
    await db.findOneAndUpdate({ collection: "users", query: { _id: req.user._id }, update: { $inc: { coin: req.body.coin }, $dec: { spin: 1 } } });

  } else if (scratch) {
    await db.findOneAndUpdate({ collection: "users", query: { _id: req.user._id }, update: { $inc: { coin: req.body.coin }, $dec: { scratch: 1 } } })

  } else {
    await db.findOneAndUpdate({ collection: "users", query: { _id: req.user._id }, update: { $inc: { coin: req.body.coin } } })
  }
  let data = await db.findOne({
    collection: "users",
    query: { _id: req.user._id },
    project: { coin: 1 }
  });
  console.log("========data ", data);
  return res.send(response.success("add coin successFully", { coin: data.coin }))

}

exports.openApp = async (req, res) => {
  let userObj = await db.findOne({
    collection: "users",
    query: { _id: req.user._id }
  })
  if (!userObj) return res.send(response.error("Not Found!", {}, 404))
  // let resetDayCollectWise = Date.now() + 1000 * 172800
  let resetDayCollectWise = Date.now() + 1000 * 60

  if (userObj.resetDayCollectWise) {

    console.log(" Date now =>", Date.now());
    console.log(" ===>>> ", userObj.resetDayCollectWise);
    // userObj.resetDayCollectWise > Date.now() + 1000 * 86400;
  }
  console.log("new Date now =>", Date.now());
  console.log(" =user data==>>> ", userObj.resetDayCollectWise);
  if (userObj.resetDayCollectWise) {
    if (userObj.resetDayCollectWise > Date.now() + 1000 * 30) return res.send(response.success("user Wallet.", { coin: userObj.coin }))

    if (Date.now() > userObj.resetDayCollectWise) {
      userObj.appOpenDay = 1
      userObj.coin += 10
    }
    else if (userObj.appOpenDay == 7) {
      userObj.appOpenDay = 1
      userObj.coin += 10
    } else {
      userObj.coin += (userObj.appOpenDay + 1) * 10
      userObj.appOpenDay += 1
    }

  }
  else if (userObj.appOpenDay == 0) {
    // userObj.resetDayCollectWise = resetDayCollectWise
    userObj.appOpenDay += 1
    userObj.coin += 10

  } else {
    userObj.appOpenDay = 1
    userObj.coin += 10
  }

  await db.findOneAndUpdate({
    collection: "users",
    // query: { token },
    query: { _id: req.user._id },
    update: {
      $set: {
        coin: userObj.coin,
        resetDayCollectWise,
        appOpenDay: userObj.appOpenDay
      }
    }
  })
  return res.send(response.success("user Wallet.", { coin: userObj.coin }))



}

exports.register = async (req, res) => {
  try {
    let { error } = validateUser(req.body)
    if (error) return res.send(response.validation(helpers.JoiParseError(error)))

    let userObj = await db.findOne({ collection: "users", query: { $or: [{ email: req.body.email }, { phone: req.body.phone }] } })
    if (userObj) return res.send(response.error("User Already exists with email or username.", {}, 400))

    let cCode = req.body.fullName[0].toUpperCase() + req.body.fullName[1] + req.body.fullName[2] + Math.floor(Math.random() * (9999 - 1010 + 1) + 1010)
    req.body.cCode = cCode;
    req.body.password = helpers.bcryptHash(req.body.password);
    req.body.coin = 0;
    userObj = await db.insertOne({ collection: "users", document: req.body })

    // req.body.otp = helpers.generateOTP()
    // userObj = await db.insertOne({ collection: "userverifications", document: req.body })
    // let payload = {
    //   varificationId: userObj._id,
    //   temp: req.body.otp
    // }
    return res.send(response.success("User Registered Successfully", userObj))
  } catch (error) {
    logger.error(error)
    return res.send(response.error("Something Went Wrong!", error.message, 500))
  }
}

exports.verify = async (req, res) => {
  try {
    let { varificationId, otp } = req.body

    let userObj = await db.findOne({
      collection: "userverifications",
      query: { _id: varificationId, otp, updatedAt: { $gt: new Date(Date.now() - 1000 * 60 * 30) } },
      project: { _id: 0, otp: 0, createdAt: 0, updatedAt: 0, __v: 0 }
    })
    if (!userObj) return res.send(response.error("Invalid OTP", {}, 401))
    userObj = await db.insertOne({ collection: "users", document: userObj })
    let payload = {
      _id: userObj._id,
      email: userObj.email,
      fname: userObj.fname,
      lname: userObj.lname,
      username: userObj.username,
      avatar: userObj.avatar
    }
    await db.deleteOne({ collection: "userverifications", query: { _id: varificationId } })
    let token = helpers.JwtSign(payload)
    return res.send(response.success("User Registered Successfully", { token }))
  } catch (error) {
    logger.error(error)
    return res.send(response.error("Something Went Wrong!", error.message, 500))
  }
}

exports.resendOTP = async (req, res) => {
  try {
    let { varificationId } = req.body

    let userObj = await db.findOne({
      collection: "userverifications",
      query: { _id: varificationId }
    })
    if (!userObj) return res.send(response.validation("Invalid varificationId"))

    // need proper rate limiter
    if (userObj.retry === 5) return res.send(response.error("Please try again after some time", {}, 400))
    let otp = helpers.generateOTP()
    await db.findOneAndUpdate({
      collection: "userverifications",
      query: { _id: varificationId },
      update: { $set: { otp }, $inc: { retry: 1 } }
    })
    return res.send(response.success("OTP Sent.", { temp: otp }))
  } catch (error) {
    logger.error(error)
    return res.send(response.error("Something Went Wrong!", error.message, 500))
  }
}

exports.sendForgotPasswordLink = async (req, res) => {
  try {
    let { email } = req.body
    if (!email) return res.send(response.validation("email required!"))

    let userObj = await db.findOne({ collection: "users", query: { email }, project: { _id: 1 } })
    if (!userObj) return res.send(response.error("User with email not exists.", {}, 400))
    // let resetPasswordToken = helpers.generateRandomString()
    let otp = helpers.generateOTP()
    let resetPasswordTokenExpiry = Date.now() + 1000 * 60
    await db.findOneAndUpdate({
      collection: "users",
      query: { email },
      update: { $set: { resetPasswordTokenExpiry, otp } }
    })
    // let link = `${process.env.BASE_URL}/reset-password/${resetPasswordToken}`
    return res.send(response.success("Otp for reset password.", { otp }))
  } catch (error) {
    logger.error(error)
    return res.send(response.error("Something Went Wrong!", error.message, 500))
  }
}

exports.resetForgotPassword = async (req, res) => {
  try {
    let { token, password, otp } = req.body
    let userObj = await db.findOne({
      collection: "users",
      query: { otp: Number(otp), resetPasswordTokenExpiry: { $gte: Date.now() } },
      // query: { email },
      project: { _id: 1 }
    })
    if (!userObj) return res.send(response.error("Token Expired!", {}, 400))

    // if (password) return res.send(response.error("password and confirm password in not match!", {}, 500))
    password = helpers.bcryptHash(password)
    await db.findOneAndUpdate({
      collection: "users",
      // query: { token },
      query: { otp },
      update: {
        $set: { password },
        $unset: { otp: "NROFnfkdf324lfnek0242kfndkfdk", resetPasswordTokenExpiry: "" }
      }
    })
    return res.send(response.success("Password Reset Successfully."))
  } catch (error) {
    logger.error(error)
    return res.send(response.error("Something Went Wrong!", error.message, 500))
  }
}

exports.getUserWallet = async (req, res) => {
  let userObj = await db.findOne({
    collection: "users",
    query: { _id: req.user._id },
    project: { coin: 1 }
  })

  if (!userObj) return res.send(response.error("Not Found!", {}, 404))

  console.log("userObj ", userObj);
  return res.send(response.success("user Wallet.", { coin: userObj.coin }))

}

exports.changePassword = async (req, res) => {
  try {
    let { currentPassword, newPassword } = req.body
    let userObj = await db.findOne({
      collection: "users",
      query: { _id: req.user._id },
      project: { password: 1 }
    })
    if (!userObj) return res.send(response.error("Not Found!", {}, 404))

    let isValid = response.bcryptCompare(currentPassword, userObj.password)
    if (!isValid) return res.send(response.error("Invalid Password!", {}, 400))
    newPassword = helpers.bcryptHash(newPassword)
    await db.findOneAndUpdate({
      collection: "users",
      query: { _id: req.user._id },
      update: { $set: { password: newPassword } }
    })
    return res.send(response.success("Password Reset Successfully."))
  } catch (error) {
    logger.error(error)
    return res.send(response.error("Something Went Wrong!", error.message, 500))
  }
}

exports.getProfileData = async (req, res) => {
  try {
    let userObj = await db.findOne({
      collection: "users",
      query: { _id: req.user._id },
      project: {
        _id: 1,
        fname: 1,
        lname: 1,
        email: 1,
        username: 1,
        avatar: 1
      }
    })
    if (!userObj) return res.send(response.error("Not Found!", {}, 404))
    return res.send(response.success("Profile Data Fetched Successfully", userObj))
  } catch (error) {
    logger.error(error)
    return res.send(response.error("Something Went Wrong!", error.message, 500))
  }
}

exports.editProfileData = async (req, res) => {
  try {
    let { error } = validateEditUserData(req.body)
    if (error) res.send(response.validation(helpers.JoiParseError(error)))

    let userObj = await db.findOne({ collection: "users", query: { _id: req.user._id } })
    if (!userObj) return res.send(response.error("Not Found!", {}, 404))
    if (userObj.avatar && userObj.avatar === req.body.avatar) {
      fs.rmSync(userObj.avatar)
    }

    await db.findOneAndUpdate({ collection: "users", query: { _id: req.user._id }, update: { $set: req.body } })
    return res.send(response.success("Profile Data Edited Successfully"))
  } catch (error) {
    logger.error(error)
    return res.send(response.error("Something Went Wrong!", error.message, 500))
  }
}


exports.getScratchOrSpin = async (req, res) => {

  try {
    console.log(" query para is", req.query);
    let spin = req.query.spin ? req.query.spin : ""
    console.log(" spin ", spin);
    let scratch = req.query.scratch ? req.query.scratch : ""
    let userObj = await db.findOne({
      collection: "users",
      query: { _id: req.user._id },
      project: { scratch: 1, spin: 1 }
    })

    if (!userObj) return res.send(response.error("Not Found!", {}, 404))
    console.log("userObj ", userObj);
    if (spin) {
      return res.send(response.success("scratch is here .", { spin: userObj.spin }))
    } else {
      return res.send(response.success("scratch is here .", { scratch: userObj.scratch }))
    }


  } catch (error) {
    console.log("error while get spin or scratch ", error);
  }

}


exports.addScratchOrSpin = async (req, res) => {

  try {


    let scratch = req.query.scratch ? Number(req.query.scratch) : ""
    let spin = req.query.spin ? Number(req.query.spin) : ""
    let coin = req.body.coin;

    let userObj = await db.findOne({
      collection: "users",
      query: { _id: req.user._id },
      project: { scratch: 1, spin: 1, coin }
    })

    if (!userObj) return res.send(response.error("Not Found!", {}, 404))

    if (scratch) {
      await db.findOneAndUpdate({
        collection: "users",
        query: { _id: req.user._id },
        update: { $inc: { scratch: scratch }, $dec: { coin: coin } }
      })

      let userObj = await db.findOne({
        collection: "users",
        query: { _id: req.user._id },
        project: { scratch: 1, spin: 1, coin: 1 }
      })
      return res.send(response.success("scratch is here .", { scratch: userObj.scratch, coin: userObj.coin }))

    } else {
      await db.findOneAndUpdate({
        collection: "users",
        query: { _id: req.user._id },
        update: { $inc: { spin: spin }, $dec: { coin: coin } }
      })

      let userObj = await db.findOne({
        collection: "users",
        query: { _id: req.user._id },
        project: { scratch: 1, spin: 1, coin: 1 }
      })
      return res.send(response.success("scratch is here .", { spin: userObj.spin, coin: userObj.coin }))
    }

  } catch (error) {

  }

}