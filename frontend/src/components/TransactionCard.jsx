import Card from "./Card";
import { useNavigate } from "react-router-dom";
const TransactionCard = ({ transaction }) => {
    const isCredit = transaction.type === "RECEIVED";
    const navigate = useNavigate();
    const counterpartyName = transaction.counterparty?.name;
    const counterpartyEmail = transaction.counterparty?.email;
    
    const displayIdentifier = transaction.counterparty?.name || transaction.counterparty?.email || "Unknown User";


    return (
        <Card 
        className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm cursor-pointer"
        onClick={() => navigate(`/transactions/${transaction.transactionId}`)}
        >
            
            {/* Left Context Block */}
            <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-800">
                    {isCredit ? "Received from " : "Sent to "}
                    <span className="font-medium text-gray-900" title={counterpartyEmail}>
                        {displayIdentifier}
                    </span>
                </p>
                
                <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-400">
                        {new Date(transaction.createdAt).toLocaleString()}
                    </p>
                    
                    {/* Status Badge indicator */}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wider uppercase ${
                        transaction.status === "SUCCESS" || transaction.status === "COMPLETED"
                            ? "bg-green-50 text-green-700" 
                            : transaction.status === "PENDING"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                    }`}>
                        {transaction.status}
                    </span>
                </div>
            </div>

            {/* Right Pricing Metrics */}
            <p className={`text-lg font-bold tracking-tight ${
                isCredit ? "text-green-600" : "text-red-600"
            }`}>
                {isCredit ? "+" : "-"}₹{transaction.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>

        </Card>
    );
};

export default TransactionCard;