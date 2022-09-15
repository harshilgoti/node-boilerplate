const router = require("express").Router()
const UserController = require("./../controllers/UserController")
const auth = require("./../middlewares/auth")

router.post("/login", UserController.login)
router.post("/register", UserController.register)
router.post("/verify", UserController.verify)
router.post("/otp/resend", UserController.resendOTP)
router.post("/forgot-password/sendLink", UserController.sendForgotPasswordLink)
router.post("/forgot-password/reset", UserController.resetForgotPassword)
router.get("/getWallet", auth, UserController.getUserWallet)


router.get("/profile", auth, UserController.getProfileData)
router.post("/profile", auth, UserController.editProfileData)
router.get("/openapp", auth, UserController.openApp)
router.post("/addcoin", auth, UserController.addCoinInWallet)
router.post("/changepassword", auth, UserController.changePassword)
router.get("/getscratchorspin", auth, UserController.getScratchOrSpin)
router.post("/addscratchorspin", auth, UserController.addScratchOrSpin)

module.exports = router
