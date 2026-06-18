import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";

const deviceSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    fingerprint: {
      type: String,
      required: true,
      unique: true,
    },

    deviceName: {
      type: String,
      required: true,
    },

    trusted: {
      type: Boolean,
      default: false,
    },

    ipAddress: {
      type: String,
    },

    country: {
      type: String,
    },

    city: {
      type: String,
    },

    firstSeen: {
      type: Date,
      default: Date.now,
    },

    lastSeen: {
      type: Date,
      default: Date.now,
    },

    lastLogin: {
      type: Date,
    },

    loginCount: {
      type: Number,
      default: 1,
    },
    refreshToken: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

deviceSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      userId: this.user,
      deviceId: this._id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    },
  );
};

deviceSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      userId: this.user,
      deviceId: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    },
  );
};

export const Device = mongoose.model("Device", deviceSchema);
