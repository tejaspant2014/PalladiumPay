import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt";
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    phoneVerified: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },


    homeCountry: {
      type: String,
      default: "IN",
    },

    usualLocation: {
        latitude: Number,
        longitude: Number,
        lastCalculatedAt: Date
    },

    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function () {
    if(!this.isModified("passwordHash")){
        return ;
    }
    this.passwordHash = await bcrypt.hash(this.passwordHash,10);
    
});

userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password, this.passwordHash);
}

export const User = mongoose.model("User", userSchema);