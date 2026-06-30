import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the error is 401 and we haven't tried refreshing yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Mark it so we don't loop infinitely

            try {
                // 🔄 Hit your new refresh token endpoint
                await axios.post(`${import.meta.env.VITE_API_URL}/users/refresh-token`, {}, { withCredentials: true });
                
                // 🎉 If successful, retry the original request (e.g., creating the wallet)
                return api(originalRequest);
            } catch (refreshError) {
                // ❌ If refreshing fails, the refresh token is expired. Force log out.
                localStorage.removeItem("user");
                window.location.replace("/login");
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;