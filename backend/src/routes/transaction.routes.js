import { Router } from "express";
import {
  addMoney,
  getTransactionById,
  getTransactionHistory,
  initiateTransfer,
  verifyOTP,
} from "../controllers/transaction.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const transactionRouter = Router();

transactionRouter.route("/add-money").post(verifyJWT, addMoney);
transactionRouter.route("/transfer").post(verifyJWT, initiateTransfer);
transactionRouter
  .route("/:transactionId/verify-otp")
  .post(verifyJWT, verifyOTP);
transactionRouter.route("/").get(verifyJWT, getTransactionHistory);
transactionRouter.route("/:transactionId").get(verifyJWT, getTransactionById);

export default transactionRouter;
