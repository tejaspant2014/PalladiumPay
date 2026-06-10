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

const updateUser = asyncHandler(async (req, res) => {
    const { name, email, phone } = req.body;
    const user = req.user;
    if(!user){
        throw new ApiError(403, "Unauthorized Access");
    }

    const updatedFields = {};
    if(name?.trim()){
        updatedFields.name = name.trim();
    }

    if(email?.trim()){
        updatedFields.email = email.trim().toLowerCase();
        updatedFields.emailVerified = false;
    }

    if(phone?.trim()){
        updatedFields.phone = phone.trim();
        updatedFields.phoneVerified = false;
    }

    if (Object.keys(updatedFields).length === 0) {
        throw new ApiError(
            400,
            "At least one field is required"
        );
    }

    const userUpd = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: updatedFields,
        },
        {
            new: true,
            runValidators: true,
        }
    ).select("-passwordHash");

    return res.status(200).json(
        new ApiResponse(
            200,
            userUpd,
            "User updated successfully"
        )
    );
})

const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (
        !currentPassword?.trim() ||
        !newPassword?.trim()
    ) {
        throw new ApiError(
            400,
            "Current and new password are required"
        );
    }

    const user = await User.findById(req.user._id);

    const isPasswordCorrect =
        await user.isPasswordCorrect(currentPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(
            401,
            "Current password is incorrect"
        );
    }

    user.passwordHash = newPassword;

    await user.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Password changed successfully"
        )
    );
});

const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const normalizedEmail =
        email?.trim().toLowerCase();

    const user = await User.findOne({
        email: normalizedEmail,
    });

    if (!user) {
        throw new ApiError(
            404,
            "User not found"
        );
    }

    const otp = generateOtp();

    const otpHash =
        await bcrypt.hash(otp, 10);

    await OTP.deleteMany({
        user: user._id,
        type: "PASSWORD_RESET",
    });

    await OTP.create({
        user: user._id,
        target: normalizedEmail,
        type: "PASSWORD_RESET",
        otpHash,
        expiresAt: new Date(
            Date.now() + 10 * 60 * 1000
        ),
    });
    const html = generateOtpHtml(otp);
    await sendEmail(
        normalizedEmail,
        "Password Reset OTP",
        `OTP: ${otp}`,
        html
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Password reset OTP sent"
        )
    );
});

const resetPassword = asyncHandler(async (req, res) => {
    const {
        email,
        otp,
        newPassword,
    } = req.body;

    const normalizedEmail =
        email.trim().toLowerCase();

    const otpDoc = await OTP.findOne({
        target: normalizedEmail,
        type: "PASSWORD_RESET",
    })

    if (!otpDoc) {
        throw new ApiError(
            400,
            "OTP not found"
        );
    }

    if (
        otpDoc.expiresAt <
        new Date()
    ) {
        throw new ApiError(
            400,
            "OTP expired"
        );
    }

    const isValid =
        await bcrypt.compare(
            otp,
            otpDoc.otpHash
        );

    if (!isValid) {
        throw new ApiError(
            400,
            "Invalid OTP"
        );
    }

    const user = await User.findById(
        otpDoc.user
    );

    user.passwordHash = newPassword;

    await user.save();

    await OTP.deleteMany({
        user: user._id,
        type: "PASSWORD_RESET",
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Password reset successful"
        )
    );
});

export {
    registerUser,
    verifyEmail,
    verifyPhone,
    loginUser,
    logoutUser,
    getMe,
    updateUser,
    forgotPassword,
    resetPassword,
    changePassword,
}
