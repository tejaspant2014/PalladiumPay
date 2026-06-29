import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import Input from "../components/Input";
import api from "../services/api.js";

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    
    // Step 1 = Requesting OTP, Step 2 = Submitting OTP & New Password
    const [step, setStep] = useState(1); 

    const [form, setForm] = useState({
        email: "",
        otp: "",
        newPassword: "",
        confirmPassword: "",
    });

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Handler 1: Trigger the OTP email
    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await api.post("/users/forgot-password", {
                email: form.email,
            });

            if (response.data?.success) {
                setSuccessMessage("OTP sent! Please check your email inbox.");
                setStep(2); // Move to password update phase
            }
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Handler 2: Verify OTP and update password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError("");

        if (form.newPassword !== form.confirmPassword) {
            return setError("Passwords do not match.");
        }

        setLoading(true);

        try {
            const response = await api.post("/users/reset-password", {
                email: form.email,
                otp: form.otp,
                newPassword: form.newPassword,
            });

            if (response.data?.success) {
                alert("Password reset successful! Redirecting to login...");
                navigate("/login");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to reset password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-10">
            <Card className="w-full max-w-xl shadow-xl">
                <div className="text-center">
                    <h1 className="text-4xl font-bold">
                        {step === 1 ? "Forgot Password?" : "Reset Your Password"}
                    </h1>
                    <p className="text-gray-600 mt-3">
                        {step === 1 
                            ? "Enter your email address and we'll send you an access code." 
                            : "Enter the code sent to your email along with your new password."}
                    </p>
                </div>

                {successMessage && !error && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm text-center">
                        {successMessage}
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm text-center">
                        {error}
                    </div>
                )}

                {step === 1 ? (
                    /* STEP 1: REQUEST OTP */
                    <form className="mt-6 space-y-5" onSubmit={handleRequestOtp}>
                        <Input
                            label="Email Address"
                            name="email"
                            type="email"
                            placeholder="your-email@example.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Sending..." : "Send OTP"}
                        </Button>
                    </form>
                ) : (
                    /* STEP 2: SUBMIT OTP & NEW PASSWORD */
                    <form className="mt-6 space-y-5" onSubmit={handleResetPassword}>
                        <Input
                            label="One-Time Password (OTP)"
                            name="otp"
                            type="text"
                            placeholder="Enter OTP code"
                            value={form.otp}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="New Password"
                            name="newPassword"
                            type="password"
                            placeholder="••••••••"
                            value={form.newPassword}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Confirm New Password"
                            name="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                        <div className="flex gap-4">
                            <Button 
                                type="button" 
                                variant="secondary" 
                                onClick={() => setStep(1)} 
                                disabled={loading}
                            >
                                Back
                            </Button>
                            <Button type="submit" className="flex-1" disabled={loading}>
                                {loading ? "Updating..." : "Reset Password"}
                            </Button>
                        </div>
                    </form>
                )}

                <p className="text-center mt-6 text-gray-600">
                    Remember your password?{" "}
                    <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                        Login
                    </Link>
                </p>
            </Card>
        </div>
    );
};

export default ForgotPassword;