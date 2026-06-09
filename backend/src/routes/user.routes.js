import { Router } from "express";
import { 
    registerUser, 
    verifyEmail, 
    verifyPhone, 
    loginUser, 
    logoutUser, 
    getMe 
} from "../controllers/user.controllers.js"; // Adjust the import path based on your file tree
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();

// --- Public Routes ---
userRouter.route("/register").post(registerUser);
userRouter.route("/verify-email").post(verifyEmail);
userRouter.route("/verify-phone").post(verifyPhone);
userRouter.route("/login").post(loginUser);

// --- Protected Routes (Requires valid JWT & Device Validation) ---
userRouter.route("/logout").post(verifyJWT, logoutUser);
userRouter.route("/me").get(verifyJWT, getMe);

export default userRouter;