const jwt = require("jsonwebtoken")
const { error } = require("../utils/response")

module.exports = function (req, res, next) {
  const token = req.header("Authorization")

  if (!token) return res.send(error("Access denied. Token not found.", {}, 401))

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (ex) {
    res.send(error("Invalid token", {}, 401))
    console.log("parthav")
  }
}
