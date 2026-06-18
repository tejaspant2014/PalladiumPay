import mongoose, { Schema } from "mongoose";

const loginAttemptSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    success: {
      type: Boolean,
      required: true,
    },

    ipAddress: String,

    device: {
      type: Schema.Types.ObjectId,
      ref: "Device",
    },
  },
  {
    timestamps: true,
  },
);

export const LoginAttempt = mongoose.model("LoginAttempt", loginAttemptSchema);
