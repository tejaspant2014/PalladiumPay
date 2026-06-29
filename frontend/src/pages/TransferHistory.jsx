import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, History, ChevronDown } from "lucide-react";
import TransactionCard from "../components/TransactionCard";
import api from "../services/api";

const TransferHistory = () => {
    const navigate = useNavigate();
    
    const [transactions, setTransactions] = useState([]);
    const [nextCursor, setNextCursor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Fetch initial page of transactions
    useEffect(() => {
        const fetchInitialTransactions = async () => {
            try {
                setLoading(true);
                // Default limit matching your backend controller safety boundaries
                const res = await api.get("/transaction?limit=20"); 
                
                if (res.data.data?.transactions) {
                    setTransactions(res.data.data.transactions);
                    setNextCursor(res.data.data.nextCursor);
                }
            } catch (err) {
                console.error("Error fetching history:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialTransactions();
    }, []);

    // Fetch subsequent pages using cursor-pagination state values
    const handleLoadMore = async () => {
        if (!nextCursor || loadingMore) return;

        try {
            setLoadingMore(true);
            const res = await api.get(`/transactions?limit=20&cursor=${nextCursor}`);
            
            if (res.data.data?.transactions) {
                // Append new batch onto your existing data array state pointer
                setTransactions((prev) => [...prev, ...res.data.data.transactions]);
                setNextCursor(res.data.data.nextCursor);
            }
        } catch (err) {
            console.error("Error loading more transactions:", err);
        } finally {
            setLoadingMore(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-lg font-medium text-gray-600 animate-pulse">Loading payment history...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                
                {/* Header Block Actions */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <button 
                            onClick={() => navigate("/dashboard")} 
                            className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition gap-2 mb-3 cursor-pointer"
                        >
                            <ArrowLeft size={16} />
                            Back to Dashboard
                        </button>
                        
                        <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                            <History size={36} className="text-gray-700" />
                            Transaction History
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Review all your incoming and outgoing fund transfers securely processed on Palladium Pay.
                        </p>
                    </div>
                </div>

                {/* Ledger Listing List Render Block */}
                <div className="space-y-4">
                    {transactions.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center">
                            <p className="text-gray-500 font-medium">No transactions found on this account yet.</p>
                        </div>
                    ) : (
                        transactions.map((transaction) => (
                            <TransactionCard
                                key={transaction.transactionId} // Using backend UUID strings safely
                                transaction={transaction}
                            />
                        ))
                    )}
                </div>

                {/* Cursor Pagination Trigger Button element */}
                {nextCursor && (
                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold rounded-xl shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {loadingMore ? (
                                <span className="animate-pulse">Loading next batch...</span>
                            ) : (
                                <>
                                    Load Older Transactions
                                    <ChevronDown size={18} />
                                </>
                            )}
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default TransferHistory;