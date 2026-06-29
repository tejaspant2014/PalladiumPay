import { Device } from "../models/device.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllDevices = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, "Unauthorized Access!");
  }
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const cursor = req.query.cursor;

  const query = {
    user: user._id,
    isActive: true,
  };

  if (cursor) {
    query._id = { $lt: cursor };
  }

  const devices = await Device.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1); // fetch one extra to check next page

  let hasNextPage = false;

  if (devices.length > limit) {
    hasNextPage = true;
    devices.pop();
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        success: true,
        devices,
        nextCursor: hasNextPage ? devices[devices.length - 1]._id : null,
      },
      "Devices fetched successfully!",
    ),
  );
});

const revokeDevice = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, "Unauthorized Access!");
  }
  const { deviceId } = req.params;
  const device = await Device.findById(deviceId);
  if (!device) {
    throw new ApiError(404, "Device Not Found!");
  }
  if (device.user.toString() !== user._id.toString()) {
    throw new ApiError(403, "Unauthorized Access!");
  }

  if (req.device && req.device._id.toString() === device._id.toString()) {
    throw new ApiError(400, "Cannot revoke current device");
  }

  device.isActive = false;
  device.refreshToken = null;
  await device.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Device Revoked Successfully!"));
});

export {
  getAllDevices,
  revokeDevice
}