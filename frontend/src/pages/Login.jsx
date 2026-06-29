import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "../context/AuthContext.jsx";
import Button from "../components/Button";
import Card from "../components/Card";
import Input from "../components/Input";

import api from "../services/api.js";
import { getDeviceInfo } from "../utils/deviceInfo";

const Login = () => {
    const navigate = useNavigate();
    const {login} = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
          const { deviceName, fingerprint } = await getDeviceInfo();
      
          const response = await api.post("/users/login", {
              email: form.email,
              password: form.password,
              deviceName,
              fingerprint,
          });
      
          const apiResponse = response.data; 
          const userData = apiResponse.data?.user; 
      
          if (apiResponse.success && userData) {
              // 1. Update your Auth Context with the user details
              login(userData); 
      
              // 2. Redirect to dashboard (Axios will manage cookies behind the scenes now!)
              navigate("/dashboard"); 
          } else {
              setError("Login response structurally incorrect.");
          }
      
      } catch (err) {
          setError(
              err.response?.data?.message ||
              "Login failed. Please check your credentials and try again."
          );
      
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-10">
            <Card className="w-full max-w-xl shadow-xl">
                <div className="text-center">
                    <h1 className="text-4xl font-bold">
                        Welcome Back
                    </h1>

                    <p className="text-gray-600 mt-3">
                        Sign in to manage your money and secure transactions.
                    </p>
                </div>

                <form
                    className="mt-8 space-y-5"
                    onSubmit={handleSubmit}
                >
                    <Input
                        label="Email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        value={form.email}
                        onChange={handleChange}
                        autoComplete="email"
                        required
                    />

                    <Input
                        label="Password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={handleChange}
                        autoComplete="current-password"
                        required
                    />

                    {error && (
                        <p className="text-red-500 text-sm">
                            {error}
                        </p>
                    )}

                    <Button
                        type="submit"
                        className="w-full cursor-pointer"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </Button>
                </form>
                <p className="text-center mt-6 text-gray-600">
                    <Link
                        to="/forgot-password"
                        className="text-blue-600 font-semibold hover:underline"
                    >
                        Forgot Password
                    </Link>
                </p>
                <p className="text-center mt-6 text-gray-600">
                    Don't have an account?{" "}
                    <Link
                        to="/register"
                        className="text-blue-600 font-semibold hover:underline"
                    >
                        Register
                    </Link>
                </p>
            </Card>
        </div>
    );
};

export default Login;