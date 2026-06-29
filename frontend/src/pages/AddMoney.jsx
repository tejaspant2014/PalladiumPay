import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IndianRupee, PlusCircle } from "lucide-react";

import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";

import api from "../services/api";

const AddMoney = () => {
    const navigate = useNavigate();

    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const quickAmounts = [500, 1000, 2000, 5000];

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        if (!amount || Number(amount) <= 0) {
            setError("Please enter a valid amount.");
            return;
        }

        const transactionId = crypto.randomUUID();

        try {
            setLoading(true);

            await api.post("/transaction/add-money", {
                transactionId,
                amount: Number(amount),
            });

            navigate("/wallet");

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to add money."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-6 py-10">
            <Card className="w-full max-w-2xl shadow-xl">

                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-green-100 p-4 rounded-2xl">
                        <IndianRupee
                            size={36}
                            className="text-green-600"
                        />
                    </div>

                    <div>
                        <h1 className="text-4xl font-bold">
                            Add Money
                        </h1>

                        <p className="text-gray-600 mt-1">
                            Deposit money into your Palladium wallet.
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                >
                    <Input
                        label="Amount"
                        type="number"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) =>
                            setAmount(e.target.value)
                        }
                        required
                    />

                    <div>
                        <p className="font-semibold mb-3">
                            Quick Select
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {quickAmounts.map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() =>
                                        setAmount(value.toString())
                                    }
                                    className="border border-gray-300 rounded-xl py-3 font-semibold hover:bg-blue-50 hover:border-blue-600 transition cursor-pointer"
                                >
                                    ₹{value}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm">
                            {error}
                        </p>
                    )}

                    <Button
                        type="submit"
                        className="w-full flex justify-center items-center gap-2 cursor-pointer"
                        disabled={loading}
                    >
                        <PlusCircle size={20} />

                        {loading
                            ? "Adding Money..."
                            : "Add Money"}
                    </Button>
                </form>

            </Card>
        </div>
    );
};

export default AddMoney;