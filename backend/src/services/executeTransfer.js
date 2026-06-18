import mongoose from "mongoose";
import { Transaction } from "../models/transaction.model.js";
import { Wallet } from "../models/wallet.model.js";
import { ApiError } from "../utils/ApiError.js";

export const executeTransfer = async (transactionId) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const txn = await Transaction.findOne({
      transactionId,
    }).session(session);

    if (!txn) {
      throw new ApiError(404, "Transaction Not Found");
    }

    if (txn.status !== "PENDING") {
      throw new ApiError(400, "Transaction already processed");
    }

    if (txn.fraudDecision !== "APPROVED" && !txn.otpVerified) {
      throw new ApiError(400, "Transaction not authorized for execution");
    }

    const senderWallet = await Wallet.findOne({
      user: txn.sender,
    }).session(session);

    const receiverWallet = await Wallet.findOne({
      user: txn.beneficiary,
    }).session(session);

    if (!senderWallet || !receiverWallet) {
      throw new ApiError(404, "Wallet not found");
    }

    const updatedSenderWallet = await Wallet.findOneAndUpdate(
      {
        _id: senderWallet._id,
        balance: {
          $gte: txn.amount,
        },
      },
      {
        $inc: {
          balance: -txn.amount,
        },
      },
      {
        new: true,
        session,
      },
    );

    if (!updatedSenderWallet) {
      throw new ApiError(400, "Insufficient Balance");
    }

    const updatedReceiverWallet = await Wallet.findOneAndUpdate(
      {
        _id: receiverWallet._id,
      },
      {
        $inc: {
          balance: txn.amount,
        },
      },
      {
        new: true,
        session,
      },
    );

    txn.status = "SUCCESS";
    txn.completedAt = new Date();

    txn.senderBalanceAfter = updatedSenderWallet.balance;

    txn.receiverBalanceAfter = updatedReceiverWallet.balance;

    await txn.save({ session });

    await session.commitTransaction();

    return {
      senderWallet: updatedSenderWallet,
      receiverWallet: updatedReceiverWallet,
      transaction: txn,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};
