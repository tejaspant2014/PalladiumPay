import Card from "./Card";
import { useNavigate } from "react-router-dom";
const BalanceCard = ({ wallet }) => {
    const navigate = useNavigate();
    return (
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl">

            <p className="text-lg opacity-90">
                Available Balance
            </p>

            <h1 className="text-5xl font-bold mt-3">
                ₹ {wallet?.balance?.toLocaleString() ?? "0.00"}
            </h1>

            <div className="flex justify-between items-center mt-10">

                <div>
                    <p className="text-sm opacity-80">
                        Wallet ID
                    </p>

                    <p className="font-semibold">
                        {wallet?._id?.slice(-8) ?? "--------"}
                    </p>
                </div>

                <button onClick={() => navigate("/add-money")} 
                        className="bg-white text-blue-600 px-5 py-2 rounded-xl font-semibold cursor-pointer">
                    Add Money
                </button>

            </div>

        </Card>
    );
};

export default BalanceCard;