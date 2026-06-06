import { User } from "../models/user.model";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async(req, res) => {
    const { name, email, phone, password, homeCountry } = req.body;
    if(!name?.trim() || !email?.trim() || !phone?.trim() || !password?.trim() || !homeCountry?.trim()){
        throw new ApiError(400, "All fields are required!");
    }
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim().toLowerCase();

    const isAlreadyUser = await User.findOne({
        $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
    });
    if(isAlreadyUser){
        throw new ApiError(400, "User already exists!");
    }

    const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        passwordHash: password,
        homeCountry: homeCountry.trim(),
    });
    
});