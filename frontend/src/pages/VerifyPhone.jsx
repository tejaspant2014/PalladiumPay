import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";

import api from "../services/api.js";

const VerifyPhone = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const email = location.state?.email;
    const phone = location.state?.phone;

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!phone) {
            navigate("/register", { replace: true });
        }
    }, [phone, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        try {
            setLoading(true);

            await api.post("/users/verify-phone", {
                phone,
                otp,
            });

            navigate("/login");

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Phone verification failed."
            );
        } finally {
            setLoading(false);
        }
    };

    if (!phone) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-10">
            <Card className="w-full max-w-xl shadow-xl">

                <div className="text-center">
                    <h1 className="text-4xl font-bold">
                        Verify Phone
                    </h1>

                    <p className="text-gray-600 mt-3">
                        Enter the OTP sent to
                    </p>

                    <p className="font-semibold text-blue-600">
                        {phone}
                    </p>
                </div>

                <form
                    className="mt-8 space-y-5"
                    onSubmit={handleSubmit}
                >
                    <Input
                        label="Phone OTP"
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
                        {loading ? "Verifying..." : "Verify Phone"}
                    </Button>
                </form>

                <p className="text-center mt-6 text-gray-600">
                    Need to register again?{" "}
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

export default VerifyPhone;