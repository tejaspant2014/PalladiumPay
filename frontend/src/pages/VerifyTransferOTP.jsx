import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";

import api from "../services/api";

const VerifyTransferOTP = () => {
    const { transactionId } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        otp: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        if ( !form.otp) {
            setError("OTP is required.");
            return;
        }

        try {
            setLoading(true);

            await api.post(
                `/transaction/${transactionId}/verify-otp`,
                {
                    
                    otp: form.otp,
                }
            );

            navigate(`/transactions/${transactionId}`);

        } catch (err) {
            setError(
              err.response?.data?.message ||
                "OTP verification failed."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-6 py-10">

            <Card className="w-full max-w-lg shadow-xl">

                <div className="text-center">

                    <div className="mx-auto w-fit bg-green-100 p-4 rounded-2xl mb-4">
                        <ShieldCheck
                            size={36}
                            className="text-green-600"
                        />
                    </div>

                    <h1 className="text-3xl font-bold">
                        Verify Transfer
                    </h1>

                    <p className="text-gray-600 mt-2">
                        Enter the OTP sent to your registered phone number.
                    </p>

                </div>

                <form
                    onSubmit={handleSubmit}
                    className="mt-8 space-y-5"
                >


                    <Input
                        label="OTP"
                        name="otp"
                        type="text"
                        placeholder="123456"
                        value={form.otp}
                        onChange={handleChange}
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
                        {loading
                            ? "Verifying..."
                            : "Verify OTP"}
                    </Button>

                </form>

            </Card>

        </div>
    );
};

export default VerifyTransferOTP;