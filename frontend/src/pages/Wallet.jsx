import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Wallet2, PlusCircle, ArrowRightLeft } from "lucide-react";

import Button from "../components/Button.jsx";
import WalletInfoCard from "../components/WalletInfoCard.jsx";

import api from "../services/api";

const Wallet = () => {
    const navigate = useNavigate();

    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWallet = async () => {
            try {
                const { data } = await api.get("/wallet");
                setWallet(data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchWallet();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-xl font-semibold">
                Loading Wallet...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">

            <div className="max-w-5xl mx-auto px-8 py-10">

                <div className="flex items-center gap-4 mb-8">

                    <div className="bg-blue-100 p-4 rounded-2xl">
                        <Wallet2
                            size={40}
                            className="text-blue-600"
                        />
                    </div>

                    <div>
                        <h1 className="text-4xl font-bold">
                            My Wallet
                        </h1>

                        <p className="text-gray-600">
                            Manage your wallet and funds.
                        </p>
                    </div>

                </div>

                <WalletInfoCard wallet={wallet} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">

                    <Button
                        className="flex justify-center items-center gap-2 cursor-pointer"
                        onClick={() => navigate("/add-money")}
                    >
                        <PlusCircle size={20} />
                        Add Money
                    </Button>

                    <Button
                        className="flex justify-center items-center gap-2 cursor-pointer"
                        onClick={() => navigate("/transfer")}
                    >
                        <ArrowRightLeft size={20} />
                        Transfer Money
                    </Button>

                </div>

            </div>

        </div>
    );
};

export default Wallet;