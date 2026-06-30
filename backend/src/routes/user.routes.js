import { Router } from "express";
import {
  registerUser,
  verifyEmail,
  verifyPhone,
  loginUser,
  logoutUser,
  getMe,
  forgotPassword,
  resetPassword,
  updateUser,
  changePassword,
  sendEmailVerificationOTP,
  sendPhoneVerificationOTP,
  refreshAccessToken
} from "../controllers/user.controllers.js"; // Adjust the import path based on your file tree
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();

// --- Public Routes ---
userRouter.route("/register").post(registerUser);
userRouter.route("/verify-email").post(verifyEmail);
userRouter.route("/verify-phone").post(verifyPhone);
userRouter.route("/login").post(loginUser);
userRouter.route("/forgot-password").post(forgotPassword);
userRouter.route("/reset-password").post(resetPassword);

// --- Protected Routes (Requires valid JWT & Device Validation) ---
userRouter.route("/logout").post(verifyJWT, logoutUser);
userRouter.route("/me").get(verifyJWT, getMe);
userRouter.route("/update-profile").patch(verifyJWT, updateUser);
userRouter.route("/change-password").patch(verifyJWT, changePassword);
userRouter.post(
  "/verify-email/send-otp",
  verifyJWT,
  sendEmailVerificationOTP
);

userRouter.post(
  "/verify-phone/send-otp",
  verifyJWT,
  sendPhoneVerificationOTP
);

userRouter.route("/refresh-token").post(refreshAccessToken);
export default userRouter;
