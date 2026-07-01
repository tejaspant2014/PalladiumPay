import { User } from "../models/user.model.js";
import { Device } from "../models/device.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { sendEmail } from "../services/email.service.js";
import { generateOtp, generateOtpHtml } from "../utils/OtpGenerator.js";
import jwt from "jsonwebtoken";
import { OTP } from "../models/otp.model.js";
import bcrypt from "bcrypt";
import geoip from "geoip-lite";
import twilio from "twilio";
import { LoginAttempt } from "../models/loginAttempt.model.js";

import mongoose from "mongoose";

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password, homeCountry, fingerprint, deviceName } =
    req.body;
    const forwarded = req.headers["x-forwarded-for"];

    const ipAddress = forwarded
      ? forwarded.split(",")[0].trim()
      : req.socket.remoteAddress;

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

  // 1. Start the MongoDB Session
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
    }).session(session); // Pass session to the query

    if (existingUser) {
      throw new ApiError(409, "User already exists!");
    }

    // 2. Create the User within the transaction
    const [user] = await User.create(
      [
        {
          name: name.trim(),
          email: normalizedEmail,
          phone: normalizedPhone,
          passwordHash: password,
          homeCountry: homeCountry.trim().toUpperCase(),
        },
      ],
      { session } // Pass session configuration
    );

    const geo = geoip.lookup(ipAddress);

    // 3. Create the Device within the transaction
    await Device.create(
      [
        {
          user: user._id,
          fingerprint: fingerprint.trim(),
          deviceName: deviceName.trim().toLowerCase(),
          ipAddress,
          country: geo?.country,
          city: geo?.city,
          lastSeen: new Date(),
          lastLogin: new Date(),
        },
      ],
      { session }
    );

    // Email OTP setup
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    await OTP.deleteMany({ user: user._id, type: "EMAIL" }).session(session);
    await OTP.create(
      [
        {
          target: normalizedEmail,
          user: user._id,
          type: "EMAIL",
          otpHash,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      ],
      { session }
    );

    // Phone OTP setup
    const client = new twilio(process.env.TWILIO_S_ID, process.env.TWILIO_AUTH_TOKEN);
    const phoneOTP = generateOtp();
    const phoneOtpHash = await bcrypt.hash(phoneOTP, 10);

    await OTP.deleteMany({ user: user._id, type: "PHONE" }).session(session);
    await OTP.create(
      [
        {
          target: normalizedPhone,
          user: user._id,
          type: "PHONE",
          otpHash: phoneOtpHash,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      ],
      { session }
    );

    // 4. Handle external Side-Effects (SMS & Email) before committing
    // If Twilio fails, the catch block catches it and aborts the transaction.
    await client.messages.create({
      body: `Your OTP Code is ${phoneOTP}`,
      from: process.env.TWILIO_PHONE,
      to: user.phone,
    });

    const html = generateOtpHtml(otp);
    await sendEmail(
      normalizedEmail,
      "OTP Verification",
      `Your OTP Code is ${otp}`,
      html
    );

    // 5. Commit the transaction if everything succeeded
    await session.commitTransaction();
    
    // Fetch the updated user outside the transaction isolation if needed, or just format the local object
    const createdUser = await User.findById(user._id)
      .select("-passwordHash -refreshToken");

    return res.status(201).json(
      new ApiResponse(
        201,
        { user: createdUser },
        "User registered successfully. Please verify your email."
      )
    );

  } catch (error) {
    // 6. Rollback all database modifications if any error occurs
    await session.abortTransaction();
    
    // Distinguish between custom API errors and unexpected issues
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, error.message || "Registration failed. Transaction aborted.");
  } finally {
    // 7. Clean up the session
    await session.endSession();
  }
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

  const isValid = await bcrypt.compare(otp, otpDoc.otpHash);

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
    },
  ).select("-passwordHash");

  await OTP.deleteMany({
    user: otpDoc.user,
    type: "EMAIL",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Email verified successfully"));
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

  const isValid = await bcrypt.compare(otp, otpDoc.otpHash);

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
    },
  ).select("-passwordHash");

  await OTP.deleteMany({
    user: otpDoc.user,
    type: "PHONE",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Phone verified successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password, fingerprint, deviceName } = req.body;

  if (
    !email?.trim() ||
    !password?.trim() ||
    !fingerprint?.trim() ||
    !deviceName?.trim()
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const forwarded = req.headers["x-forwarded-for"];

  const ipAddress = forwarded
    ? forwarded.split(",")[0].trim()
    : req.socket.remoteAddress;

  const geo = geoip.lookup(ipAddress);

  const user = await User.findOne({
    email: normalizedEmail,
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  let device = await Device.findOne({
    user: user._id,
    fingerprint: fingerprint.trim(),
  });

  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    await LoginAttempt.create({
      user: user._id,
      device: device?._id,
      success: false,
      ipAddress,
    });

    throw new ApiError(401, "Invalid credentials");
  }


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

  if (device.loginCount >= 3 && user.emailVerified && user.phoneVerified) {
    device.trusted = true;
  }

  const accessToken = device.generateAccessToken();

  const refreshToken = device.generateRefreshToken();

  device.refreshToken = refreshToken;
  device.isActive = true;
  await device.save({
    validateBeforeSave: false,
  });

  await LoginAttempt.create({
    user: user._id,
    device: device._id,
    success: true,
    ipAddress,
  });

  const loggedInUser = await User.findById(user._id).select("-passwordHash");

  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          deviceTrusted: device.trusted,
        },
        "Login successful",
      ),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const device = await Device.findById(req.device._id);

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
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

const getMe = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
      throw new ApiError(401, "Unauthorized Access");
  }

  return res.status(200).json(
      new ApiResponse(
          200,
          {
              _id: user._id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              country: user.homeCountry,
              emailVerified: user.emailVerified,
              phoneVerified: user.phoneVerified,
              createdAt: user.createdAt,
          },
          "User fetched successfully!"
      )
  );
});

const updateUser = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;
  const user = req.user;
  if (!user) {
    throw new ApiError(401, "Unauthorized Access");
  }

  const updatedFields = {};
  if (name?.trim()) {
    updatedFields.name = name.trim();
  }

  if (email?.trim()) {
    updatedFields.email = email.trim().toLowerCase();
    if(email.trim().toLowerCase() != user.email) updatedFields.emailVerified = false;
  }

  if (phone?.trim()) {
    updatedFields.phone = phone.trim();
    if(phone.trim() != user.phone) updatedFields.phoneVerified = false;
  }
  if ((email?.trim() && email.trim().toLowerCase() != user.email) || (phone?.trim() && phone.trim() != user.phone)) {
    await Device.updateMany(
      { user: user._id },
      {
        trusted: false,
        loginCount: 0,
        refreshToken: null,
      },
    );
  }
  if (Object.keys(updatedFields).length === 0) {
    throw new ApiError(400, "At least one field is required");
  }

  const userUpd = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: updatedFields,
    },
    {
      new: true,
      runValidators: true,
    },
  ).select(
    "_id name email phone homeCountry emailVerified phoneVerified createdAt"
  );
  return res
    .status(200)
    .json(new ApiResponse(200, userUpd, "User updated successfully"));
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword?.trim() || !newPassword?.trim()) {
    throw new ApiError(400, "Current and new password are required");
  }

  const user = await User.findById(req.user._id);

  const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Current password is incorrect");
  }

  user.passwordHash = newPassword;
  await Device.updateMany(
    { user: user._id },
    {
      trusted: false,
      loginCount: 0,
      refreshToken: null,
    },
  );
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const normalizedEmail = email?.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const otp = generateOtp();

  const otpHash = await bcrypt.hash(otp, 10);

  await OTP.deleteMany({
    user: user._id,
    type: "PASSWORD_RESET",
  });

  await OTP.create({
    user: user._id,
    target: normalizedEmail,
    type: "PASSWORD_RESET",
    otpHash,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  const html = generateOtpHtml(otp);
  await sendEmail(normalizedEmail, "Password Reset OTP", `OTP: ${otp}`, html);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset OTP sent"));
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const normalizedEmail = email.trim().toLowerCase();

  const otpDoc = await OTP.findOne({
    target: normalizedEmail,
    type: "PASSWORD_RESET",
  });

  if (!otpDoc) {
    throw new ApiError(400, "OTP not found");
  }

  if (otpDoc.expiresAt < new Date()) {
    throw new ApiError(400, "OTP expired");
  }

  const isValid = await bcrypt.compare(otp, otpDoc.otpHash);

  if (!isValid) {
    throw new ApiError(400, "Invalid OTP");
  }

  const user = await User.findById(otpDoc.user);

  user.passwordHash = newPassword;

  await Device.updateMany(
    { user: user._id },
    {
      trusted: false,
      loginCount: 0,
      refreshToken: null,
    },
  );

  await user.save();

  await OTP.deleteMany({
    user: user._id,
    type: "PASSWORD_RESET",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successful"));
});

const sendEmailVerificationOTP = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(401, "Unauthorized Access");
  }

  if (user.emailVerified) {
    throw new ApiError(400, "Email already verified");
  }

  const emailOTP = generateOtp();
  const otpHash = await bcrypt.hash(emailOTP, 10);

  await OTP.deleteMany({
    user: user._id,
    type: "EMAIL",
  });

  await OTP.create({
    user: user._id,
    target: user.email,
    type: "EMAIL",
    otpHash,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  const html = generateOtpHtml(emailOTP);
  await sendEmail(
    user.email,
    "OTP Verification",
    `Your OTP Code is ${emailOTP}`,
    html
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Verification email sent successfully!"
      )
    );
});

const sendPhoneVerificationOTP = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(401, "Unauthorized Access");
  }

  if (user.phoneVerified) {
    throw new ApiError(400, "Phone already verified");
  }

  const phoneOTP = generateOtp();
  const otpHash = await bcrypt.hash(phoneOTP, 10);

  await OTP.deleteMany({
    user: user._id,
    type: "PHONE",
  });

  await OTP.create({
    user: user._id,
    target: user.phone,
    type: "PHONE",
    otpHash,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  const client = new twilio(
    process.env.TWILIO_S_ID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {
    await client.messages.create({
      body: `Your Palladium Pay verification OTP is ${phoneOTP}`,
      from: process.env.TWILIO_PHONE,
      to: user.phone,
    });
  } catch (error) {
    throw new ApiError(500, `SMS Delivery Failed: ${error.message}`);
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Verification OTP sent successfully!"
      )
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // 1. Grab the refresh token from cookies (or headers)
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is missing!");
  }

  // 2. Verify the token hasn't expired or been tampered with
  const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  
  const user = await User.findById(decodedToken?._id);
  if (!user) {
    throw new ApiError(401, "Invalid refresh token!");
  }

  // 3. Security Check: Cross-reference with the token saved in the Database
  if (incomingRefreshToken !== user.refreshToken) {
    throw new ApiError(401, "Refresh token is expired or used!");
  }

  // 4. Generate & Send a shiny new Access Token
  const { accessToken, newRefreshToken } = await generateAccessAndRefereshTokens(user._id);

  const options = { httpOnly: true, secure: true };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options) // Optional: Rotate the refresh token
    .json(new ApiResponse(200, { accessToken }, "Access token refreshed successfully!"));
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
  sendEmailVerificationOTP,
  sendPhoneVerificationOTP,
  refreshAccessToken,
};
