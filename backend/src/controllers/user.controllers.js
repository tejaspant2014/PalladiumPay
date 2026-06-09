import { User } from "../models/user.model.js";
import { Device } from "../models/device.model.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { sendEmail } from "../services/email.service.js";
import { generateOtp, generateOtpHtml } from "../utils/OtpGenerator.js";
import { OTP } from "../models/otp.model.js";
import bcrypt from "bcrypt";
import geoip from "geoip-lite";
import twilio from "twilio";


const registerUser = asyncHandler(async (req, res) => {
    const {
        name,
        email,
        phone,
        password,
        homeCountry,
        fingerprint,
        deviceName,
    } = req.body;

    const ipAddress =
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress;

    if (
        !name?.trim() ||
        !email?.trim() ||
        !phone?.trim() ||
        !password?.trim() ||
        !homeCountry?.trim() ||
        !fingerprint?.trim() ||
        !deviceName?.trim()
    ) {
        throw new ApiError(400, "All fields are required!");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    const existingUser = await User.findOne({
        $or: [
            { email: normalizedEmail },
            { phone: normalizedPhone },
        ],
    });

    if (existingUser) {
        throw new ApiError(409, "User already exists!");
    }

    const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        passwordHash: password,
        homeCountry: homeCountry.trim().toUpperCase(),
    });

    const geo = geoip.lookup(ipAddress);

    const device = await Device.create({
        user: user._id,
        fingerprint: fingerprint.trim(),
        deviceName: deviceName.trim().toLowerCase(),
        ipAddress,
        country: geo?.country,
        city: geo?.city,
        lastSeen: new Date(),
        lastLogin: new Date(),
    });

    

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    await OTP.deleteMany({
        user: user._id,
        type: "EMAIL",
    });

    await OTP.create({
        target: normalizedEmail,
        user: user._id,
        type: "EMAIL",
        otpHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    const html = generateOtpHtml(otp);

    await sendEmail(
        normalizedEmail,
        "OTP Verification",
        `Your OTP Code is ${otp}`,
        html
    );

    const client = new twilio(process.env.TWILIO_S_ID, process.env.TWILIO_AUTH_TOKEN);
    const phoneOTP = generateOtp();
    const phoneOtpHash = await bcrypt.hash(phoneOTP, 10);

    await OTP.deleteMany({
        user: user._id,
        type: "PHONE",
    });

    await OTP.create({
        target: phone.trim(),
        user: user._id,
        type: "PHONE",
        otpHash: phoneOtpHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    try {
        const result = await client.messages.create({
            body: `Your OTP Code is ${phoneOTP}`,
            from: process.env.TWILIO_PHONE,
            to: user.phone
        })
    } catch (error) {
        await User.findByIdAndDelete(user._id);
        await Device.findByIdAndDelete(device._id);
        await OTP.deleteMany({ user: user._id });
        throw new ApiError(500, `SMS Delivery Failed: ${error.message}`);
    }
    
    const createdUser = await User.findById(user._id).select(
        "-passwordHash -refreshToken"
    );
    return res.status(201).json(
        new ApiResponse(
            201,
            {
                user: createdUser,
            },
            "User registered successfully. Please verify your email."
        )
    );
});

const verifyEmail = asyncHandler(async (req, res) => {
    const { otp, email } = req.body;

    if (!otp?.trim() || !email?.trim()) {
        throw new ApiError(400, "OTP and email are required");
    }

    const normalizedEmail = email.trim().toLowerCase();

    const otpDoc = await OTP.findOne({
        target: normalizedEmail,
        type: "EMAIL",
    });

    if (!otpDoc) {
        throw new ApiError(400, "OTP not found");
    }

    if (otpDoc.expiresAt < new Date()) {
        throw new ApiError(400, "OTP has expired");
    }

    const isValid = await bcrypt.compare(
        otp,
        otpDoc.otpHash
    );

    if (!isValid) {
        throw new ApiError(400, "Invalid OTP");
    }

    const user = await User.findByIdAndUpdate(
        otpDoc.user,
        {
            emailVerified: true,
        },
        {
            new: true,
        }
    ).select("-passwordHash");

    await OTP.deleteMany({
        user: otpDoc.user,
        type: "EMAIL",
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "Email verified successfully"
        )
    );
});

const verifyPhone = asyncHandler(async (req, res) => {
    const { otp, phone } = req.body;

    if (!otp?.trim() || !phone?.trim()) {
        throw new ApiError(400, "OTP and phone are required");
    }

    const normalizedPhone = phone.trim();

    const otpDoc = await OTP.findOne({
        target: normalizedPhone,
        type: "PHONE",
    });

    if (!otpDoc) {
        throw new ApiError(400, "OTP not found");
    }

    if (otpDoc.expiresAt < new Date()) {
        throw new ApiError(400, "OTP has expired");
    }

    const isValid = await bcrypt.compare(
        otp,
        otpDoc.otpHash
    );

    if (!isValid) {
        throw new ApiError(400, "Invalid OTP");
    }

    const user = await User.findByIdAndUpdate(
        otpDoc.user,
        {
            phoneVerified: true,
        },
        {
            new: true,
        }
    ).select("-passwordHash");

    await OTP.deleteMany({
        user: otpDoc.user,
        type: "PHONE",
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "Phone verified successfully"
        )
    );
});

const loginUser = asyncHandler(async (req, res) => {
    const {
        email,
        password,
        fingerprint,
        deviceName,
    } = req.body;

    if (
        !email?.trim() ||
        !password?.trim() ||
        !fingerprint?.trim() ||
        !deviceName?.trim()
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
        email: normalizedEmail,
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordCorrect =
        await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid credentials");
    }

    if (!user.emailVerified || !user.phoneVerified) {
        throw new ApiError(
            403,
            "Please verify your email and phone first"
        );
    }

    const ipAddress =
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress;

    const geo = geoip.lookup(ipAddress);

    let device = await Device.findOne({
        user: user._id,
        fingerprint: fingerprint.trim(),
    });

    if (!device) {
        device = await Device.create({
            user: user._id,
            fingerprint: fingerprint.trim(),
            deviceName: deviceName.trim(),
            ipAddress,
            country: geo?.country,
            city: geo?.city,
            trusted: false,
        });
    }

    device.lastSeen = new Date();
    device.lastLogin = new Date();
    device.loginCount += 1;

    const accessToken =
        device.generateAccessToken();

    const refreshToken =
        device.generateRefreshToken();

    device.refreshToken = refreshToken;

    await device.save({
        validateBeforeSave: false,
    });

    const loggedInUser = await User.findById(
        user._id
    ).select("-passwordHash -refreshToken");

    const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
    };

    return res
        .status(200)
        .cookie(
            "accessToken",
            accessToken,
            cookieOptions
        )
        .cookie(
            "refreshToken",
            refreshToken,
            cookieOptions
        )
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "Login successful"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    const device = await Device.findById(
        req.device._id
    );

    if (device) {
        device.refreshToken = null;

        await device.save({
            validateBeforeSave: false,
        });
    }

    const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
    };

    return res
        .status(200)
        .clearCookie(
            "accessToken",
            cookieOptions
        )
        .clearCookie(
            "refreshToken",
            cookieOptions
        )
        .json(
            new ApiResponse(
                200,
                {},
                "Logged out successfully"
            )
        );
});

const getMe = asyncHandler(async (req, res) => {
    const user = req.user;
    if(!user){
        throw new ApiError(403, "Unauthorized Access");
    }

    return res.status(200).json(new ApiResponse(200,{"name" : user.name, "phone": user.phone, "email": user.email}, "User fetched successfully!" ))
})
export {
    registerUser,
    verifyEmail,
    verifyPhone,
    loginUser,
    logoutUser,
    getMe,
}
