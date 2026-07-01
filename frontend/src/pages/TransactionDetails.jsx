import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

import api from "../services/api";

const TransactionDetails = () => {
    const { transactionId } = useParams();
    const navigate = useNavigate();

    const [tx, setTx] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTransactionDetails = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/transaction/${transactionId}`);
                setTx(res.data.data); 
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.message || "Failed to load transaction details.");
            } finally {
                setLoading(false);
            }
        };

        if (transactionId) fetchTransactionDetails();
    }, [transactionId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-lg font-medium text-gray-600">Loading details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
                <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-sm text-center border border-gray-200">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button 
                        onClick={() => navigate(-1)} 
                        className="px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium transition cursor-pointer"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!tx) return null;

    const isSent = tx.type === "SENT";

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-xl mx-auto">
                
                {/* Header Actions */}
                <div className="mb-6 flex items-center">
                    <button 
                        onClick={() => navigate("/transactions")} 
                        className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition gap-2 cursor-pointer"
                    >
                        <ArrowLeft size={18} />
                        Back to Transactions
                    </button>
                </div>

                {/* Main Detail Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    
                    {/* Visual Banner Area */}
                    <div className="p-8 text-center border-b border-gray-100 bg-gray-50/50">
                        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                            isSent ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                        }`}>
                            {isSent ? <ArrowUpRight size={28} /> : <ArrowDownLeft size={28} />}
                        </div>
                        
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                            {isSent ? '-' : '+'}₹{tx.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </h1>
                        
                        <p className="text-sm font-medium text-gray-500 mt-2">
                            {isSent ? 'Sent to' : 'Received from'} 
                            <span className="block font-mono text-gray-800 text-xs mt-1 bg-gray-100 py-1 px-2.5 rounded-md inline-block">
                                {tx.counterparty.name}
                            </span>
                        </p>

                        {/* Status Tag */}
                        <div className="mt-4 flex justify-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border tracking-wider uppercase ${
                                tx.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                                tx.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-red-50 text-red-700 border-red-200'
                            }`}>
                                {tx.status === 'COMPLETED' && <CheckCircle2 size={14} className="mr-1.5" />}
                                {tx.status === 'PENDING' && <Clock size={14} className="mr-1.5 animate-pulse" />}
                                {tx.status === 'FAILED' && <XCircle size={14} className="mr-1.5" />}
                                {tx.status}
                            </span>
                        </div>
                    </div>

                    {/* Balance Tracking (Ledger Breakdown) */}
                    <div className="p-6 bg-gray-50/30 space-y-3 border-b border-gray-100">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ledger Impact</h3>
                        
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Balance Before</span>
                            <span className="font-mono font-medium">₹{tx.balanceBefore?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">{isSent ? 'Amount Deducted' : 'Amount Credited'}</span>
                            <span className={`font-mono font-medium ${isSent ? 'text-red-600' : 'text-green-600'}`}>
                                {isSent ? '-' : '+'}₹{tx.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        
                        <div className="flex justify-between text-sm pt-3 border-t border-gray-200/60">
                            <span className="text-gray-900 font-bold">Balance After</span>
                            <span className="font-mono font-bold text-gray-900">₹{tx.balanceAfter?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    {/* Metadata Details */}
                    <div className="p-6 space-y-4 bg-white">
                        <div>
                            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Transaction reference id</span>
                            <span className="font-mono text-sm text-gray-700 bg-gray-50 py-1.5 px-3 rounded-lg border border-gray-100 block break-all select-all">
                                {transactionId}
                            </span>
                        </div>
                        
                        <div>
                            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Settled On</span>
                            <span className="text-sm font-medium text-gray-700">
                                {new Date(tx.createdAt).toLocaleString(undefined, {
                                    dateStyle: 'long',
                                    timeStyle: 'medium'
                                })}
                            </span>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default TransactionDetails;