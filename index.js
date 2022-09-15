require("dotenv").config()
const express = require("express")
const app = express()
let cors = require('cors')
var CronJob = require('cron').CronJob;
var cron = require('node-cron');
const db = require("./utils/mongoose")

let server

app.use(cors({
  origin: '*'
}))

if (process.env.PROTOCOL === "https") {
  const fs = require("fs")
  const httpsOptions = (module.exports = {
    key: fs.readFileSync("path/to/key.key"),
    cert: fs.readFileSync("path/to/cert.crt")
  })

  console.log("https Server Started")
  server = require("https").createServer(httpsOptions, app)
} else {
  console.log("http Server Started")
  server = require("http").createServer(app)
}

app.get("/test", (req, res) => {
  res.send("Success")
})


require("./loaders/routes")(app)
require("./loaders/logging")(app)
console.log(" start server");

(async () => {
  try {

    await require("./loaders/db")()



    server.listen(process.env.PORT, () => {
      console.log("Server started 🚀 =>", process.env.PORT)
    })

    console.log("start ==> ");
    cron.schedule('0 0 * * *', async () => {
      console.log('running a task every day', new Date());

      // let userObj = await db.findAll({ collection: "users", query: {} })
      // console.log(" user Obj =>> ", userObj);

      await db.updateMany({ collection: "users", query: {}, update: { $set: { scratch: 5, spin: 5 } } })


    });

  } catch (error) {
    console.log(" error , ", error);
  }
})()