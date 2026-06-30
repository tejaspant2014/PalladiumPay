import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";

import api from "../services/api";

const VerifyUpdatedPhone = () => {
    const navigate = useNavigate();

    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data } = await api.get("/users/me");
                setPhone(data.data.phone);
            } catch (err) {
                navigate("/login");
            } finally {
                setPageLoading(false);
            }
        };

        fetchUser();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError("");

            await api.post("/users/verify-phone", {
                phone,
                otp,
            });

            navigate("/profile");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Phone verification failed."
            );
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading...
            </div>
        );
    }

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

                    <p className="font-semibold text-blue-600 mt-1">
                        {phone}
                    </p>

                </div>

                <form
                    onSubmit={handleSubmit}
                    className="mt-8 space-y-5"
                >

                    <Input
                        label="Phone OTP"
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

            </Card>

        </div>
    );
};

export default VerifyUpdatedPhone;