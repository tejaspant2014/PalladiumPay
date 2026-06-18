import mongoose, { Schema } from "mongoose";

const otpSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    target: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["EMAIL", "PHONE", "PASSWORD_RESET"],
      required: true,
    },

    otpHash: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const OTP = mongoose.model("OTP", otpSchema);
