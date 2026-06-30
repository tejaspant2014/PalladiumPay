import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../components/Card";
import Button from "../components/Button";
import { Wallet } from "lucide-react";
import api from "../services/api";

const CreateWallet = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleCreateWallet = async () => {
        setError("");

        try {
            setLoading(true);

            await api.post("/wallet/create-wallet");

            navigate("/dashboard", { replace: true });

        } catch (err) {
            setError(
                err?.response?.data?.message ||
                "Failed to create wallet."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-10">
            <Card className="w-full max-w-xl shadow-xl" >

                <div className="text-center">

                    <div className="text-6xl mb-6">
                        <Wallet size={60}className="ml-55"/>
                    </div>

                    <h1 className="text-4xl font-bold">
                        Create Your Wallet
                    </h1>

                    <p className="text-gray-600 mt-4">
                        You're just one step away from using Palladium Pay.
                        Create your wallet to securely send, receive, and manage your money.
                    </p>

                </div>

                {error && (
                    <p className="text-red-500 text-center mt-6">
                        {error}
                    </p>
                )}

                <div className="mt-8">
                    <Button
                        className="w-full cursor-pointer"
                        onClick={handleCreateWallet}
                        disabled={loading}
                    >
                        {loading ? "Creating Wallet..." : "Create Wallet"}
                    </Button>
                </div>

            </Card>
        </div>
    );
};

export default CreateWallet;