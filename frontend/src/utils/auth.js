let logoutFn = null;

export const registerLogout = (fn) => {
    logoutFn = fn;
};

export const forceLogout = () => {
    if (logoutFn) {
        logoutFn();
    }
};