import { Router } from "express";
import { createWallet, getWallet } from "../controllers/wallet.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const walletRouter = Router();

walletRouter.route("/create-wallet").post(verifyJWT, createWallet);
walletRouter.route("/").get(verifyJWT, getWallet);

export default walletRouter;
