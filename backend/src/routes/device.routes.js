import { Router } from "express";
import { revokeDevice, getAllDevices } from "../controllers/device.controllers.js";

const deviceRouter = Router();
deviceRouter.route("/").get(getAllDevices);
deviceRouter.route("/:deviceId").post(revokeDevice);

export default deviceRouter