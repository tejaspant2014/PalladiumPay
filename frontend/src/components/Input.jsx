const Input = ({
    label,
    type = "text",
    placeholder,
    ...props
}) => {
    return (
        <div>

            <label className="block mb-2 font-medium text-gray-700">
                {label}
            </label>

            <input
                type={type}
                placeholder={placeholder}
                className="
w-full
rounded-xl
border border-gray-300
px-4 py-3
text-gray-800
placeholder:text-gray-400
focus:border-blue-500
focus:ring-4
focus:ring-blue-100
outline-none
transition
"
                {...props}
            />

        </div>
    );
};

export default Input;