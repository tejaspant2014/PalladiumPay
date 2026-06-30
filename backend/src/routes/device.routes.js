import { Router } from "express";
import { revokeDevice, getAllDevices } from "../controllers/device.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const deviceRouter = Router();
deviceRouter.route("/").get(verifyJWT, getAllDevices);
deviceRouter.route("/:deviceId").post(verifyJWT, revokeDevice);

export default deviceRouter