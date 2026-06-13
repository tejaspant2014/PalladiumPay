import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Wallet } from "../models/wallet.model.js";
import { Transaction } from "../models/transaction.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import geoip from "geoip-lite";
import { User } from "../models/user.model.js";

const addMoney = asyncHandler(async(req, res) => {
    const { amount, transactionId } = req.body;
    const user = req.user;
    if(!user){
        throw new ApiError(403, "Unauthorized Access!");
    }

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
    
        const wallet = await Wallet.findOne({user: user?._id}).session(session);
    
        if (!wallet) {
          throw new ApiError(404, "Wallet Not Found!");
        }

        // idempotency check (inside session)
        const existingTx = await Transaction.findOne({
            transactionId,
            sender: user._id
        }).session(session);

        if (existingTx) {
            await session.abortTransaction();

            const latestWallet = await Wallet.findById(wallet._id);

            return res.status(200).json(new ApiResponse(200, latestWallet, "Already processed!"));
        }

        // create transaction
        await Transaction.create(
        [{
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
        }],
        { session }
        );

        // update wallet atomically
        const updatedWallet = await Wallet.findOneAndUpdate(
        { _id: wallet._id },
        { $inc: { balance: numericAmount } },
        { new: true, session }
        );

        // mark transaction success
        await Transaction.updateOne(
            { transactionId },
            { $set: { status: "SUCCESS" } },
            { session }
        );

        await session.commitTransaction();
        

        return res.status(200).json(new ApiResponse(200, updatedWallet, "Amount Added Successfully!"));

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }
});

const transferMoney = asyncHandler(async(req, res) => {
    const {transactionId, amount, receiverEmail } = req.body;
    const user = req.user;
    const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    if(!user){
        throw new ApiError(403, "Unauthorized Access!");
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new ApiError(400, "Amount must be greater than 0");
    }

    if (!transactionId?.trim()) {
        throw new ApiError(400, "TransactionId required");
    }

    if(!receiverEmail?.trim()){
        throw new ApiError(400, "receiver Email Address required!");
    }
    const device = req.device;
    const geo = geoip.lookup(ipAddress);
    

    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const receiver = await User.findOne({email: receiverEmail.trim().toLowerCase()});
    
        if(!receiver){
            throw new ApiError(404, "No receiver Found!");
        }

        if (receiver._id.toString() === user._id.toString()) {
            throw new ApiError(
                400,
                "Cannot transfer to yourself"
            );
        }
        const senderWallet = await Wallet.findOne({user: user?._id}).session(session);
        const receiverWallet = await Wallet.findOne({user: receiver?._id}).session(session);
        if(!senderWallet){
            throw new ApiError(404, "Wallet not found!")
        }
        if(!receiverWallet){
            throw new ApiError(404, "receiver Wallet Not Found!");
        }

        const existingTx = await Transaction.findOne({
            transactionId,
            sender: user._id,
            beneficiary: receiver._id,
        }).session(session);

        if (existingTx) {
            await session.abortTransaction();

            const latestSenderWallet = await Wallet.findById(senderWallet._id);
            const latestreceiverWallet = await Wallet.findById(receiverWallet._id);
            return res.status(200).json(new ApiResponse(200, {"senderWallet": latestSenderWallet, "receiverWallet": latestreceiverWallet}, "Already processed!"));
        }
        await Transaction.create(
            [{
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
            }],
            { session }
        );
        const updatedSenderWallet = await Wallet.findOneAndUpdate(
            {
                _id: senderWallet._id,
                balance: { $gte: numericAmount }
            },
            {
                $inc: { balance: -numericAmount }
            },
            {
                new: true,
                session
            }
        );
        if (!updatedSenderWallet) {
            throw new ApiError(
                400,
                "Insufficient balance"
            );
        }
        const updatedreceiverWallet = await Wallet.findOneAndUpdate(
            { _id: receiverWallet._id },
            { $inc: { balance: numericAmount } },
            { new: true, session }
        );
        await Transaction.updateOne(
            { transactionId, sender: user._id, beneficiary: receiver._id },
            { $set: { status: "SUCCESS" } },
            { session }
        );

        await session.commitTransaction();
        

        return res.status(200).json(new ApiResponse(200, {"updatedSenderWallet": updatedSenderWallet, "updatedreceiverWallet": updatedreceiverWallet}, "Transfer Completed Successfully!"));

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally{
        await session.endSession();
    }
});

const getTransactionHistory = asyncHandler(async(req, res) => {
    const userId = req.user._id;
    if(!userId) throw new ApiError(403, "Unauthorized Access!");
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const cursor = req.query.cursor;

    const query = {
        $or: [
        { sender: userId },
        { beneficiary: userId }
        ]
    };

    if (cursor) {
        query._id = { $lt: cursor };
    }

    const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 ,_id: -1 })
        .limit(limit + 1); // fetch one extra to check next page

    let hasNextPage = false;

    if (transactions.length > limit) {
        hasNextPage = true;
        transactions.pop();
    }

    const formatted = transactions.map(tx => {
    const isSender = tx.sender.toString() === userId.toString();

    if (isSender) {
      return {
        transactionId: tx.transactionId,
        type: "SENT",
        amount: tx.amount,
        balanceBefore: tx.senderBalanceBefore,
        balanceAfter: tx.senderBalanceAfter,
        counterparty: tx.beneficiary,
        status: tx.status,
        createdAt: tx.createdAt
      };
    }

    return {
      transactionId: tx.transactionId,
      type: "RECEIVED",
      amount: tx.amount,
      balanceBefore: tx.receiverBalanceBefore,
      balanceAfter: tx.receiverBalanceAfter,
      counterparty: tx.sender,
      status: tx.status,
      createdAt: tx.createdAt
    };
  });

  return res.status(200).json(new ApiResponse(200,{
    success: true,
    transactions: formatted,
    nextCursor: hasNextPage ? transactions[transactions.length - 1]._id : null
  }, "Transactions fetched successfully!"));
});

const getTransactionById = asyncHandler(async(req, res) => {
    const user = req.user;
    if(!user) throw new ApiError(403, "Unauthorized Access!");
    const { transactionId } = req.params;

  const tx = await Transaction.findOne({ transactionId });

  if (!tx) {
    throw new ApiError(404, "Transaction not found");
  }

  const isSender = tx.sender.toString() === userId.toString();
  const isReceiver = tx.beneficiary.toString() === userId.toString();
  if (!isSender && !isReceiver) {
    throw new ApiError(403, "Access denied");
  }

  const response = isSender
    ? {
        type: "SENT",
        amount: tx.amount,
        balanceBefore: tx.senderBalanceBefore,
        balanceAfter: tx.senderBalanceAfter,
        counterparty: tx.beneficiary,
        status: tx.status,
        createdAt: tx.createdAt
      }
    : {
        type: "RECEIVED",
        amount: tx.amount,
        balanceBefore: tx.receiverBalanceBefore,
        balanceAfter: tx.receiverBalanceAfter,
        counterparty: tx.sender,
        status: tx.status,
        createdAt: tx.createdAt
      };
    return res.status(200).json(200, response, "Transaction Fetched Successfully!");
});

export {
    addMoney,
    transferMoney,
    getTransactionHistory,
    getTransactionById,
}