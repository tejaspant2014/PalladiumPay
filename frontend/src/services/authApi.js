import api from "./api";

export const register = (data) => {
    return api.post("/auth/register", data);
};

export const login = (data) => {
    return api.post("/users/login", data);
};

export const verifyOTP = (data) => {
    return api.post("/users/verify-otp", data);
};

export const getCurrentUser = () => {
    return api.get("/users/me");
};

export const logout = () => {
    return api.post("/users/logout");
};