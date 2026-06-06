import mongoose, {mongo, Schema} from "mongoose";

const deviceSchema = new mongoose.Schema(
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
    }
  );

  export const Device = mongoose.model("Device", deviceSchema);