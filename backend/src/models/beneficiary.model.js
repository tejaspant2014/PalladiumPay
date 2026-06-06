import mongoose, {Schema} from "mongoose";

const beneficiarySchema = new mongoose.Schema(
    {
      owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
  
      beneficiaryUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
  
      nickname: {
        type: String,
        trim: true,
      },
  
      isVerified: {
        type: Boolean,
        default: false,
      },
  
      lastTransactionAt: {
        type: Date,
      },
  
      transactionCount: {
        type: Number,
        default: 0,
      },
  
      totalAmountSent: {
        type: Number,
        default: 0,
      },
  
      isFavorite: {
        type: Boolean,
        default: false,
      }
    },
    {
      timestamps: true,
    }
  );
  
  // Prevent duplicate beneficiaries
  beneficiarySchema.index(
    { owner: 1, beneficiaryUser: 1 },
    { unique: true }
  );

  export const Beneficiary = mongoose.model("Beneficiary", beneficiarySchema);