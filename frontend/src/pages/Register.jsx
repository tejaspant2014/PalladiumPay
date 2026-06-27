import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Button from "../components/Button";
import Card from "../components/Card";
import Input from "../components/Input";

import api from "../services/api.js";
import { getDeviceInfo } from "../utils/deviceInfo";

const Register = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        homeCountry: "",
        password: "",
        confirmPassword: "",
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

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const { deviceName, fingerprint } = await getDeviceInfo();

            await api.post("/users/register", {
                name: form.name,
                email: form.email,
                phone: form.phone,
                homeCountry: form.homeCountry,
                password: form.password,
                deviceName,
                fingerprint,
            });

            navigate("/verify-email", {
                state: {
                    email: form.email,
                    phone: form.phone,
                },
            });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Registration failed. Please try again."
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
                        Create Account
                    </h1>

                    <p className="text-gray-600 mt-3">
                        Start sending money securely with AI-powered fraud detection.
                    </p>
                </div>

                <form
                    className="mt-8 space-y-5"
                    onSubmit={handleSubmit}
                >
                    <Input
                        label="Full Name"
                        name="name"
                        type="text"
                        placeholder="John Doe"
                        value={form.name}
                        onChange={handleChange}
                        autoComplete="name"
                        required
                    />

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
                        label="Phone"
                        name="phone"
                        type="tel"
                        placeholder="+91 9876543210"
                        value={form.phone}
                        onChange={handleChange}
                        autoComplete="tel"
                        required
                    />

                    <Input
                        label="Country"
                        name="homeCountry"
                        type="text"
                        placeholder="IN"
                        value={form.homeCountry}
                        onChange={handleChange}
                        required
                    />

                    <Input
                        label="Password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={handleChange}
                        autoComplete="new-password"
                        required
                    />

                    <Input
                        label="Confirm Password"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        autoComplete="new-password"
                        required
                    />

                    {error && (
                        <p className="text-red-500 text-sm">
                            {error}
                        </p>
                    )}

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                    >
                        {loading ? "Creating Account..." : "Create Account"}
                    </Button>
                </form>

                <p className="text-center mt-6 text-gray-600">
                    Already have an account?{" "}
                    <Link
                        to="/login"
                        className="text-blue-600 font-semibold hover:underline"
                    >
                        Login
                    </Link>
                </p>
            </Card>
        </div>
    );
};

export default Register;
