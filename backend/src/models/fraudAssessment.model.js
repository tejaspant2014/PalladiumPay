import mongoose, { Schema } from "mongoose";

const fraudAssessmentSchema = new mongoose.Schema(
  {
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
      unique: true,
    },

    modelVersion: {
      type: String,
      default: "CatBoost-v1",
    },

    features: {
      amount: Number,

      distanceFromHomeKm: Number,

      newPayee: Boolean,

      trustedDevice: Boolean,

      internationalTransaction: Boolean,

      countryMismatch: Boolean,

      transactionsLast24h: Number,

      failedLoginsLastWeek: Number,

      merchantType: String,

      transactionType: String,
    },

    reasons: [
      {
        type: String,
      },
    ],

    reviewedByAdmin: {
      type: Boolean,
      default: false,
    },

    reviewedAt: {
      type: Date,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    adminNotes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

fraudAssessmentSchema.index({ reviewedByAdmin: 1 });

export const FraudAssessment = mongoose.model(
  "FraudAssessment",
  fraudAssessmentSchema,
);
