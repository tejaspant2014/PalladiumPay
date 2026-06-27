const Button = ({ children, variant = "primary", className = "", ...props }) => {
  const styles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "border border-blue-600 text-blue-600 hover:bg-blue-50",
  };

  return (
    <button
     
      className={`px-5 py-2 rounded-xl font-normal transition ${styles[variant]} ${className}`}
      {...props} 
    >
      {children}
    </button>
  );
};

export default Button;