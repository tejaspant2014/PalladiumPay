import { UAParser } from "ua-parser-js";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

export const getDeviceInfo = async () => {
    const parser = new UAParser();
    const result = parser.getResult();

    const fp = await FingerprintJS.load();
    const visitor = await fp.get();

    return {
        deviceName: `${result.browser.name} on ${result.os.name}`,
        fingerprint: visitor.visitorId,
    };
};