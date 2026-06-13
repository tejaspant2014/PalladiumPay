import mongoose, {Schema} from "mongoose";

const transactionSchema = new mongoose.Schema(
    {
      transactionId: {
        type: String,
        required: true,
        unique: true,
      },
  
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
  
      beneficiary: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
  
      amount: {
        type: Number,
        required: true,
        min: 0,
      },
  
      currency: {
        type: String,
        default: "INR",
      },
  
      transactionType: {
        type: String,
        enum: ["TRANSFER", "PAYMENT", "DEPOSIT", "WITHDRAWAL"],
        required: true,
      },
  
      merchantType: {
        type: String,
        enum: [
          "Dining",
          "Electronics",
          "Entertainment",
          "Financial",
          "Luxury",
          "Travel",
          "Utilities",
          "Other",
        ],
        default: "Other",
      },
  
      status: {
        type: String,
        enum: ["PENDING", "SUCCESS", "FAILED", "BLOCKED"],
        default: "PENDING",
      },
  
      senderBalanceBefore: {
        type: Number,
        required: true,
      },
  
      senderBalanceAfter: {
        type: Number,
        required: true,
      },

      receiverBalanceBefore: {
        type: Number,
        required: true,
      },
  
      receiverBalanceAfter: {
        type: Number,
        required: true,
      },
      device: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Device",
      },
  
      ipAddress: {
        type: String,
      },
  
      country: {
        type: String,
      },
  
      location: {
        latitude: Number,
        longitude: Number,
      },
  
      otpRequired: {
        type: Boolean,
        default: false,
      },
  
      otpVerified: {
        type: Boolean,
        default: false,
      },
  
      riskScore: {
        type: Number,
        min: 0,
        max: 1,
        default: 0,
      },
  
      fraudDecision: {
        type: String,
        enum: ["APPROVED", "OTP_REQUIRED", "BLOCKED"],
        default: "APPROVED",
      },
  
      note: {
        type: String,
        maxlength: 100,
      },
    },
    {
      timestamps: true,
    }
  );
  
  // Useful indexes
  transactionSchema.index({ sender: 1, createdAt: -1 });
  transactionSchema.index({ beneficiary: 1, createdAt: -1 });
  transactionSchema.index({ fraudDecision: 1 });
  transactionSchema.index({ status: 1 });
  
export const Transaction = mongoose.model("Transaction", transactionSchema);
