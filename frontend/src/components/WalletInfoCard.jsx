import Card from "./Card";

const WalletInfoCard = ({ wallet }) => {
    return (
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl">

            <p className="text-lg opacity-90">
                Current Balance
            </p>

            <h1 className="text-5xl font-bold mt-2">
                ₹ {wallet?.balance?.toLocaleString() ?? "0.00"}
            </h1>

            <div className="grid grid-cols-2 gap-8 mt-10">

                <div>
                    <p className="text-sm opacity-80">
                        Wallet ID
                    </p>

                    <p className="font-semibold mt-1 break-all">
                        {wallet?._id}
                    </p>
                </div>

                <div>
                    <p className="text-sm opacity-80">
                        Status
                    </p>

                    <p className="font-semibold mt-1 text-green-300">
                        Active
                    </p>
                </div>

                <div>
                    <p className="text-sm opacity-80">
                        Created On
                    </p>

                    <p className="font-semibold mt-1">
                        {wallet?.createdAt
                            ? new Date(wallet.createdAt).toLocaleDateString()
                            : "N/A"}
                    </p>
                </div>

                <div>
                    <p className="text-sm opacity-80">
                        Last Updated
                    </p>

                    <p className="font-semibold mt-1">
                        {wallet?.updatedAt
                            ? new Date(wallet.updatedAt).toLocaleDateString()
                            : "N/A"}
                    </p>
                </div>

            </div>

        </Card>
    );
};

export default WalletInfoCard;