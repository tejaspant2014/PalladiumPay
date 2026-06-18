import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(cookieParser());

// routes

import healthCheckRouter from "./routes/healthcheck.routes.js";
app.use("/api/healthcheck", healthCheckRouter);

import userRouter from "./routes/user.routes.js";
app.use("/api/v1/users", userRouter);

import walletRouter from "./routes/wallet.routes.js";
app.use("/api/v1/wallet", walletRouter);

import transactionRouter from "./routes/transaction.routes.js";
app.use("/api/v1/transaction", transactionRouter);
export { app };
