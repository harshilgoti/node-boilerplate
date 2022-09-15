const mongoose = require("mongoose")

module.exports = async function connectToDatabase() {

  try {


    await mongoose.connect(process.env.MONGO_URI).then(() => {
      console.log("DB Connected")
    })

    mongoose.set("debug", true)
  } catch (error) {
    console.log("catch =", error);
  }
}
