import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Wallet } from "../models/wallet.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createWallet = asyncHandler(async(req, res) => {
    const user = req.user;
    if(!user){
        throw new ApiError(403, "Unauthorized Access!");
    }

    if(!user.emailVerified){
        throw new ApiError(403, "Email Verification Required!");
    }

    if(!user.phoneVerified){
        throw new ApiError(403, "Phone Verification Required!");
    }

    const existingWallet = await Wallet.findOne({
        user: user._id,
    });
    
    if (existingWallet) {
        throw new ApiError(
            400,
            "Wallet already exists"
        );
    }

    const wallet = await Wallet.create({
        user: user._id,
        balance: 0
    })

    return res.status(200).json(new ApiResponse(200, wallet, "Wallet Created Successfully!"));
});

const getWallet = asyncHandler(async(req, res) => {
  const user = req.user;
  if(!user){
    throw new ApiError(403, "Unauthorized Access!");
  }

  const wallet = await Wallet.findOne({
    user: user._id
  })

  if(!wallet){
    throw new ApiError(404, "No wallet found!");
  }

  return res.status(200).json(new ApiResponse(200, wallet, "Wallet fetched successfully!"));
})

export {
  createWallet,
  getWallet,
}