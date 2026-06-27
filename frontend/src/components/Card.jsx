import React from "react";

const Card = ({
    children,
    className = "",
    hover = false,
    ...props
  }) => {
    return (
      <div
        className={`
          rounded-3xl
          border
          border-gray-200
          bg-white
          p-8
          shadow-sm
          ${hover ? "transition duration-300 hover:shadow-xl hover:-translate-y-1" : ""}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  };
  
  export default Card;