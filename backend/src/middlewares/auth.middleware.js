import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Device } from "../models/device.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = 
            req.cookies?.accessToken || 
            req.header("Authorization")?.replace("Bearer ", "");
        
        if (!token) {
            throw new ApiError(401, "Unauthorized access request. Token missing.");
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        const user = await User.findById(decodedToken?.userId).select("-passwordHash -refreshToken");
        
        if (!user) {
            throw new ApiError(401, "Invalid Access Token. User not found.");
        }

        if (!decodedToken?.deviceId) {
            throw new ApiError(401, "Malformed token payload. Device validation context missing.");
        }

        const device = await Device.findById(decodedToken.deviceId);

        if (!device) {
            throw new ApiError(401, "Device unrecognized or session has expired.");
        }

        if (device.user.toString() !== user._id.toString()) {
            throw new ApiError(403, "Device ownership mismatch violation.");
        }

        req.user = user;
        req.device = device;
        
        next();

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token");
    }
});