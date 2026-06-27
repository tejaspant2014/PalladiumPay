import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";

import api from "../services/api.js";

const VerifyEmail = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const email = location.state?.email;
    const phone = location.state?.phone;

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!email) {
            navigate("/register", { replace: true });
        }
    }, [email, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        try {
            setLoading(true);

            await api.post("/users/verify-email", {
                email,
                otp,
            });

            navigate("/verify-phone", {
                state: {
                    email,
                    phone,
                },
            });

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Email verification failed."
            );
        } finally {
            setLoading(false);
        }
    };

    if (!email) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-10">
            <Card className="w-full max-w-xl shadow-xl">

                <div className="text-center">
                    <h1 className="text-4xl font-bold">
                        Verify Email
                    </h1>

                    <p className="text-gray-600 mt-3">
                        Enter the OTP sent to
                    </p>

                    <p className="font-semibold text-blue-600">
                        {email}
                    </p>
                </div>

                <form
                    className="mt-8 space-y-5"
                    onSubmit={handleSubmit}
                >
                    <Input
                        label="Email OTP"
                        name="otp"
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
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
                        {loading ? "Verifying..." : "Verify Email"}
                    </Button>
                </form>

                <p className="text-center mt-6 text-gray-600">
                    Wrong email?{" "}
                    <Link
                        to="/register"
                        className="text-blue-600 font-semibold hover:underline"
                    >
                        Register Again
                    </Link>
                </p>

            </Card>
        </div>
    );
};

export default VerifyEmail;