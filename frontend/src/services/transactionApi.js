import api from "./api";

export const register = (data) => {
    return api.post("/auth/register", data);
};

export const login = (data) => {
    return api.post("/auth/login", data);
};

export const verifyOTP = (data) => {
    return api.post("/auth/verify-otp", data);
};

export const getCurrentUser = () => {
    return api.get("/auth/me");
};

export const logout = () => {
    return api.post("/auth/logout");
};