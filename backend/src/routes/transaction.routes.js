import { Router } from "express";
import { addMoney, transferMoney, getTransactionById, getTransactionHistory } from "../controllers/transaction.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const transactionRouter = Router();

transactionRouter.route("/add-money").post(verifyJWT, addMoney);
transactionRouter.route("/transfer").post(verifyJWT, transferMoney);
transactionRouter.route("/").get(verifyJWT, getTransactionHistory);
transactionRouter.route("/:transactionId").get(verifyJWT, getTransactionById);

export default transactionRouter;