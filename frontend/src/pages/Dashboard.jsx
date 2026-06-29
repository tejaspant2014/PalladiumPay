import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Send, History, Wallet } from 'lucide-react';
import BalanceCard from "../components/BalanceCard";
import QuickActionCard from "../components/QuickActionCard";
import TransactionCard from "../components/TransactionCard";

import api from "../services/api";

const Dashboard = () => {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const userRes = await api.get("/users/me");

                setUser(userRes.data.data);

                try {
                    const walletRes = await api.get("/wallet");
                    setWallet(walletRes.data.data);
                } catch (err) {
                    if (err.response?.status === 404) {
                        navigate("/create-wallet");
                        return;
                    }
                }

                const transactionRes = await api.get("/transaction");

                if (transactionRes.data.data?.transactions) {
                  setTransactions(transactionRes.data.data.transactions.slice(0, 5));
              }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg font-medium">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">

            <div className="max-w-6xl mx-auto">

                <div className="mb-8">
                    <h1 className="text-4xl font-bold">
                        Welcome back, {user?.name} 👋
                    </h1>

                    <p className="text-gray-600 mt-2">
                        Manage your finances securely with Palladium Pay.
                    </p>
                </div>
                
                <BalanceCard wallet={wallet} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">

                <QuickActionCard
                  title="Add Money"
                  description="Deposit funds into your wallet."
                  icon={<PlusCircle size={24} />}
                  onClick={() => navigate("/add-money")}
                />
                <QuickActionCard
                  title="Transfer Money"
                  description="Send money securely."
                  icon={<Send size={24} />}
                  onClick={() => navigate("/transfer")} 
                />

                <QuickActionCard
                  title="Transactions"
                  description="View your payment history."
                  icon={<History size={24} />}
                  onClick={() => navigate("/transactions")}
                />

                <QuickActionCard
                  title="My Wallet"
                  description="View wallet details."
                  icon={<Wallet size={24} />}
                  onClick={() => navigate("/wallet")} 
                />

                </div>

                <div className="mt-12">

                    <div className="flex justify-between items-center mb-5">

                        <h2 className="text-2xl font-bold">
                            Recent Transactions
                        </h2>

                        <button
                            onClick={() => navigate("/transactions")}
                            className="text-blue-600 hover:underline cursor-pointer"
                        >
                            View All
                        </button>

                    </div>

                    <div className="space-y-4">

                        {transactions.length === 0 ? (
                            <p className="text-gray-500">
                                No transactions yet.
                            </p>
                        ) : (
                            transactions.map((transaction) => (
                                <TransactionCard
                                    key={transaction.transactionId}
                                    transaction={transaction}
                                />
                            ))
                        )}

                    </div>

                </div>

            </div>

        </div>
    );
};

export default Dashboard;