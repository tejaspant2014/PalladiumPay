import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Wallet } from "../models/wallet.model.js";
import { Transaction } from "../models/transaction.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import geoip from "geoip-lite";
import { User } from "../models/user.model.js";
import { generateFraudFeatures } from "../services/featureGeneration.js";
import { getFraudProbability } from "../services/fraudDetection.service.js";
import { OTP } from "../models/otp.model.js";
import { generateOtp } from "../utils/OtpGenerator.js";
import twilio from "twilio";
import bcrypt from "bcrypt";
import { executeTransfer } from "../services/executeTransfer.js";

const addMoney = asyncHandler(async (req, res) => {
  const { amount, transactionId } = req.body;
  const user = req.user;
  if (!user) {
    throw new ApiError(401, "Unauthorized Access!");
  }

  if (!user.phoneVerified || !user.emailVerified)
    throw new ApiError(403, "Phone and Email Verification Required!");
  const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new ApiError(400, "Amount must be greater than 0");
  }

  if (!transactionId?.trim()) {
    throw new ApiError(400, "TransactionId required");
  }

  const device = req.device;
  const geo = geoip.lookup(ipAddress);

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const wallet = await Wallet.findOne({ user: user?._id }).session(session);

    if (!wallet) {
      throw new ApiError(404, "Wallet Not Found!");
    }

    // idempotency check (inside session)
    const existingTx = await Transaction.findOne({
      transactionId,
      sender: user._id,
    }).session(session);

    if (existingTx) {
      await session.abortTransaction();

      const latestWallet = await Wallet.findById(wallet._id);

      return res
        .status(200)
        .json(new ApiResponse(200, latestWallet, "Already processed!"));
    }

    // create transaction
    await Transaction.create(
      [
        {
          sender: user._id,
          transactionId,
          beneficiary: user._id,
          amount: numericAmount,
          transactionType: "DEPOSIT",
          status: "PENDING",
          senderBalanceBefore: wallet.balance,
          senderBalanceAfter: wallet.balance + numericAmount,
          receiverBalanceBefore: wallet.balance,
          receiverBalanceAfter: wallet.balance + numericAmount,
          device: device?._id,
          ipAddress,
          country: geo?.country,
          location: {
            latitude: geo?.ll?.[0],
            longitude: geo?.ll?.[1],
          },
        },
      ],
      { session },
    );

    // update wallet atomically
    const updatedWallet = await Wallet.findOneAndUpdate(
      { _id: wallet._id },
      { $inc: { balance: numericAmount } },
      { new: true, session },
    );

    // mark transaction success
    await Transaction.updateOne(
      { transactionId },
      { $set: { status: "SUCCESS" } },
      { session },
    );

    await session.commitTransaction();

    return res
      .status(200)
      .json(new ApiResponse(200, updatedWallet, "Amount Added Successfully!"));
  } catch (error) {
    try {
      await Transaction.updateOne(
        {
          transactionId,
          sender: user._id,
          status: "PENDING",
        },
        {
          $set: {
            status: "FAILED",
          },
        },
        { session },
      );
    } catch (e) {
      // ignore secondary failure
    }

    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
});

const initiateTransfer = asyncHandler(async (req, res) => {
  const { transactionId, amount, receiverEmail } = req.body;
  const user = req.user;
  if (!user.phoneVerified || !user.emailVerified)
    throw new ApiError(403, "Phone and Email Verification Required!");
  const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  if (!user) {
    throw new ApiError(401, "Unauthorized Access!");
  }

  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new ApiError(400, "Amount must be greater than 0");
  }

  if (!transactionId?.trim()) {
    throw new ApiError(400, "TransactionId required");
  }

  if (!receiverEmail?.trim()) {
    throw new ApiError(400, "receiver Email Address required!");
  }
  const device = req.device;
  const geo = geoip.lookup(ipAddress);

  const receiver = await User.findOne({
    email: receiverEmail.trim().toLowerCase(),
  });

  if (!receiver) {
    throw new ApiError(404, "No receiver Found!");
  }

  if (receiver._id.toString() === user._id.toString()) {
    throw new ApiError(400, "Cannot transfer to yourself");
  }

  if (!receiver.phoneVerified || !receiver.emailVerified)
    throw new ApiError(403, "Beneficiary Not Verified!");
  const senderWallet = await Wallet.findOne({ user: user?._id });
  const receiverWallet = await Wallet.findOne({ user: receiver?._id });
  if (!senderWallet) {
    throw new ApiError(404, "Wallet not found!");
  }
  if (!receiverWallet) {
    throw new ApiError(404, "receiver Wallet Not Found!");
  }

  const existingTx = await Transaction.findOne({
    transactionId,
    sender: user._id,
    beneficiary: receiver._id,
  });

  if (existingTx) {
    if (existingTx.status === "SUCCESS") {
      return res
        .status(200)
        .json(
          new ApiResponse(200, existingTx, "Transaction already processed"),
        );
    }

    if (existingTx.status === "BLOCKED") {
      throw new ApiError(400, "Transaction blocked");
    }

    if (existingTx.status === "PENDING") {
      // APPROVED but execution never happened
      if (existingTx.fraudDecision === "APPROVED") {
        const response = await executeTransfer(existingTx.transactionId);

        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              response,
              "Recovered and completed transaction",
            ),
          );
      }

      // Waiting for OTP
      if (existingTx.fraudDecision === "OTP_REQUIRED") {
        const client = new twilio(
          process.env.TWILIO_S_ID,
          process.env.TWILIO_AUTH_TOKEN,
        );
        const phoneOTP = generateOtp();
        const phoneOtpHash = await bcrypt.hash(phoneOTP, 10);

        await OTP.deleteMany({
          user: user._id,
          type: "PHONE",
        });

        await OTP.create({
          target: user.phone,
          user: user._id,
          type: "PHONE",
          otpHash: phoneOtpHash,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });

        try {
          const result = await client.messages.create({
            body: `Your OTP Code for Payment MFA is ${phoneOTP}`,
            from: process.env.TWILIO_PHONE,
            to: user.phone,
          });
        } catch (error) {
          throw new ApiError(500, `SMS Delivery Failed: ${error.message}`);
        }
        return res
          .status(200)
          .json(new ApiResponse(200, existingTx, "OTP verification pending"));
      }

      // Permanently blocked
      if (existingTx.fraudDecision === "BLOCKED") {
        throw new ApiError(400, "Transaction blocked");
      }
    }
  }
  if (senderWallet.balance < numericAmount) {
    throw new ApiError(400, "Insufficient balance");
  }

  const txn = await Transaction.create({
    sender: user._id,
    transactionId,
    beneficiary: receiver._id,
    amount: numericAmount,
    transactionType: "TRANSFER",
    status: "PENDING",
    senderBalanceBefore: senderWallet.balance,
    senderBalanceAfter: senderWallet.balance - numericAmount,
    receiverBalanceBefore: receiverWallet.balance,
    receiverBalanceAfter: receiverWallet.balance + numericAmount,
    device: device?._id,
    ipAddress,
    country: geo?.country,
    location: {
      latitude: geo?.ll?.[0],
      longitude: geo?.ll?.[1],
    },
  });

  const features = await generateFraudFeatures({
    user,
    receiver,
    device,
    senderWallet,
    amount: numericAmount,
  });
  if (!features) throw new ApiError(500, "Feature Generation Failed!");

  const fraudScore = await getFraudProbability(features);
  if (!fraudScore) throw new ApiError(500, "Fraud Probability Not Generated!");
  txn.riskScore = fraudScore.fraud_probability;

  if (fraudScore.fraud_probability < 0.05 && numericAmount < 50000) {
    txn.fraudDecision = "APPROVED";
    txn.otpRequired = false;
    await txn.save();
    const response = await executeTransfer(transactionId);
    return res
      .status(200)
      .json(new ApiResponse(200, response, "Transfer Completed Successfully!"));
  } else if (
    (fraudScore.fraud_probability >= 0.05 &&
    fraudScore.fraud_probability < 0.5)||
    numericAmount > 50000
  ) {
    txn.fraudDecision = "OTP_REQUIRED";
    txn.otpRequired = true;
    await txn.save();

    const client = new twilio(
      process.env.TWILIO_S_ID,
      process.env.TWILIO_AUTH_TOKEN,
    );
    const phoneOTP = generateOtp();
    const phoneOtpHash = await bcrypt.hash(phoneOTP, 10);

    await OTP.deleteMany({
      user: user._id,
      type: "PHONE",
    });

    await OTP.create({
      target: user.phone,
      user: user._id,
      type: "PHONE",
      otpHash: phoneOtpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    try {
      const result = await client.messages.create({
        body: `Your OTP Code for Payment MFA is ${phoneOTP}`,
        from: process.env.TWILIO_PHONE,
        to: user.phone,
      });
    } catch (error) {
      throw new ApiError(500, `SMS Delivery Failed: ${error.message}`);
    }
  } else {
    txn.fraudDecision = "BLOCKED";
    txn.status = "BLOCKED";
    await txn.save();
    throw new ApiError(400, "Transfer Blocked!");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        txn,
        "Transaction Initiated Successfully OTP Verification Required!",
      ),
    );
});

const verifyOTP = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;

  const { otp } = req.body;
  const user = req.user;

  if (!otp?.trim()) {
    throw new ApiError(400, "All Fields Are Required!");
  }


  if (!user) throw new ApiError(401, "Unauthorized Access!");

  const txn = await Transaction.findOne({
    sender: user._id,
    transactionId,
  });

  if (!txn) {
    throw new ApiError(404, "Transaction Not Found!");
  }

  if (!txn.otpRequired || txn.otpVerified) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "No Verification Needed!"));
  }
  if (txn.status === "SUCCESS") {
    throw new ApiError(400, "Transaction already completed");
  }

  const otpDoc = await OTP.findOne({
    user: user._id,
    target: user.phone,
    type: "PHONE",
  });

  if (!otpDoc) {
    throw new ApiError(400, "OTP not found");
  }

  if (otpDoc.expiresAt < new Date()) {
    throw new ApiError(400, "OTP has expired");
  }

  const isValid = await bcrypt.compare(otp, otpDoc.otpHash);

  if (!isValid) {
    throw new ApiError(400, "Invalid OTP");
  }
  txn.otpVerified = true;
  await txn.save();

  await OTP.deleteMany({
    user: otpDoc.user,
    type: "PHONE",
  });
  const response = await executeTransfer(transactionId);
  return res
    .status(200)
    .json(new ApiResponse(200, response, "Transfer Completed!"));
});

const getTransactionHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  if (!userId) throw new ApiError(401, "Unauthorized Access!");
  
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const cursor = req.query.cursor;

  const query = {
    $or: [{ sender: userId }, { beneficiary: userId }],
  };

  if (cursor) {
    query._id = { $lt: cursor };
  }

  // Populate profiles to retrieve name and email parameters directly
  const transactions = await Transaction.find(query)
    .populate("sender", "name email")
    .populate("beneficiary", "name email")
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1); 

  let hasNextPage = false;

  if (transactions.length > limit) {
    hasNextPage = true;
    transactions.pop();
  }

  const formatted = transactions.map((tx) => {
    const senderId = tx.sender._id?.toString() || tx.sender.toString();
    const beneficiaryId = tx.beneficiary._id?.toString() || tx.beneficiary.toString();

    const isSender = senderId === userId.toString();
    const isReceiver = beneficiaryId === userId.toString();
    const isSelfDeposit = isSender && isReceiver;

    if (isSender && !isSelfDeposit) {
      return {
        transactionId: tx.transactionId,
        type: "SENT",
        amount: tx.amount,
        balanceBefore: tx.senderBalanceBefore,
        balanceAfter: tx.senderBalanceAfter,
        counterparty: {
          id: tx.beneficiary._id,
          name: tx.beneficiary.name,
          email: tx.beneficiary.email
        },
        status: tx.status,
        createdAt: tx.createdAt,
      };
    }

    return {
      transactionId: tx.transactionId,
      type: "RECEIVED",
      amount: tx.amount,
      balanceBefore: tx.receiverBalanceBefore,
      balanceAfter: tx.receiverBalanceAfter,
      counterparty: {
        id: tx.sender._id,
        name: tx.sender.name,
        email: tx.sender.email
      },
      status: tx.status,
      createdAt: tx.createdAt,
    };
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        success: true,
        transactions: formatted,
        nextCursor: hasNextPage
          ? transactions[transactions.length - 1]._id
          : null,
      },
      "Transactions fetched successfully!",
    ),
  );
});
const getTransactionById = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw new ApiError(401, "Unauthorized Access!");
  const { transactionId } = req.params;

  // Fetch transaction and populate the user profiles with name and email fields
  const tx = await Transaction.findOne({ transactionId })
    .populate("sender", "name email")
    .populate("beneficiary", "name email");

  if (!tx) {
    throw new ApiError(404, "Transaction not found");
  }

  // Support both Object matching and fallback check if populated properties are evaluated
  const senderId = tx.sender._id?.toString() || tx.sender.toString();
  const beneficiaryId = tx.beneficiary._id?.toString() || tx.beneficiary.toString();

  const isSender = senderId === user._id.toString();
  const isReceiver = beneficiaryId === user._id.toString();
  
  if (!isSender && !isReceiver) {
    throw new ApiError(401, "Access denied");
  }

  // Explicitly identify addMoney self-deposits
  const isSelfDeposit = isSender && isReceiver;
  const treatAsReceiver = isSelfDeposit ? true : isReceiver;

  const response = !treatAsReceiver
    ? {
        transactionId: tx.transactionId,
        type: "SENT",
        amount: tx.amount,
        balanceBefore: tx.senderBalanceBefore,
        balanceAfter: tx.senderBalanceAfter,
        counterparty: {
          id: tx.beneficiary._id,
          name: tx.beneficiary.name,
          email: tx.beneficiary.email
        },
        status: tx.status,
        createdAt: tx.createdAt,
      }
    : {
        transactionId: tx.transactionId,
        type: "RECEIVED",
        amount: tx.amount,
        balanceBefore: tx.receiverBalanceBefore,
        balanceAfter: tx.receiverBalanceAfter,
        counterparty: {
          id: tx.sender._id,
          name: tx.sender.name,
          email: tx.sender.email
        },
        status: tx.status,
        createdAt: tx.createdAt,
      };

  return res
    .status(200)
    .json(new ApiResponse(200, response, "Transaction Fetched Successfully!"));
});

export {
  addMoney,
  verifyOTP,
  initiateTransfer,
  getTransactionHistory,
  getTransactionById,
};
