import Card from "./Card";

const QuickActionCard = ({
    icon,
    title,
    description,
    onClick,
}) => {
    return (
        <Card
            onClick={onClick}
            className="cursor-pointer transition-all duration-200 hover:-translate-y-2 hover:shadow-xl"
        >
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                {icon}
            </div>

            <h3 className="text-2xl font-bold mt-6">
                {title}
            </h3>

            <p className="text-gray-500 mt-2">
                {description}
            </p>
        </Card>
    );
};

export default QuickActionCard;