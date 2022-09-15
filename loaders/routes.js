const express = require("express")
const cors = require("cors")
const Routes = require("../routes")

module.exports = (app) => {
  app.use(express.json({ limit: "50mb" }))
  app.use(express.urlencoded({ extended: true }))
  app.use(express.static("uploads"))

  app.options("*", cors())

  // routes
  app.use("/api/user", Routes.User)

  app.get("/", (req, res) => {
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection.socket ? req.connection.socket.remoteAddress : null)
    const toSave = {
      ipAddress: ip,
      time: Date.now()
    }
    res.send(toSave)
  })
}
