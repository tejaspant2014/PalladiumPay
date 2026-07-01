import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SendHorizontal } from "lucide-react";

import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";

import api from "../services/api";

const Transfer = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        receiverEmail: "",
        amount: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        if (!form.receiverEmail || !form.amount) {
            setError("All fields are required.");
            return;
        }

        const transactionId = crypto.randomUUID();

        try {
            setLoading(true);

            const { data } = await api.post("/transaction/transfer", {
                transactionId,
                receiverEmail: form.receiverEmail,
                amount: Number(form.amount),
            });

            const txn = data.data;
            
            if (txn.otpRequired === true) {
                
                navigate(`/verify-transfer/${txn.transactionId}`);
            } else {
                
                navigate(`/transactions/${txn.transaction.transactionId}`);
            }

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Transfer failed."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-6 py-10">

            <Card className="w-full max-w-2xl shadow-xl">

                <div className="flex items-center gap-4 mb-8">

                    <div className="bg-blue-100 p-4 rounded-2xl">
                        <SendHorizontal
                            className="text-blue-600"
                            size={34}
                        />
                    </div>

                    <div>
                        <h1 className="text-4xl font-bold">
                            Transfer Money
                        </h1>

                        <p className="text-gray-600 mt-1">
                            Send money securely to another Palladium user.
                        </p>
                    </div>

                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                >

                    <Input
                        label="Recipient Email"
                        name="receiverEmail"
                        type="email"
                        placeholder="john@example.com"
                        value={form.receiverEmail}
                        onChange={handleChange}
                    />

                    <Input
                        label="Amount"
                        name="amount"
                        type="number"
                        placeholder="1000"
                        value={form.amount}
                        onChange={handleChange}
                    />

                    {error && (
                        <p className="text-red-500 text-sm">
                            {error}
                        </p>
                    )}

                    <Button
                        type="submit"
                        className="w-full flex justify-center items-center gap-2"
                        disabled={loading}
                    >
                        <SendHorizontal size={18} />

                        {loading
                            ? "Initiating..."
                            : "Transfer Money"}
                    </Button>

                </form>

            </Card>

        </div>
    );
};

export default Transfer;