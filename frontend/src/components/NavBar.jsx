import React from 'react';
import Button from './Button.jsx';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx'; // 👈 Import your auth hook

const NavBar = () => {
  const logoSrc = "/logo.png"; 
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth(); // 👈 Pull auth state and logout action

  const handleLogout = () => {
    logout();
    navigate("/login"); // Send them back to login after clearing state
  };

  return (
    <nav className="flex justify-between items-center w-full max-w-7xl mx-auto px-6 py-4">
        {/* Logo Section */}
        <div className="flex items-center">
            <Link to={isAuthenticated ? "/dashboard" : "/"} className="cursor-pointer hover:opacity-80 transition">
                <img 
                  src={logoSrc} 
                  alt="Palladium Pay Logo" 
                  className="w-auto h-12 object-contain"
                />
            </Link>
        </div>

        {/* Dynamic Navigation/Buttons Section */}
        <div className="flex items-center gap-6">
            {isAuthenticated ? (
                // 🌟 SHOW THIS WHEN LOGGED IN
                <>
                    <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium transition">
                        Dashboard
                    </Link>
                    <Link to="/wallet" className="text-gray-600 hover:text-blue-600 font-medium transition">
                        Wallet
                    </Link>
                    <Link to="/transfer" className="text-gray-600 hover:text-blue-600 font-medium transition">
                        Transfer
                    </Link>
                    <Link to="/create-wallet" className="text-gray-600 hover:text-blue-600 font-medium transition">
                        Create Wallet 
                    </Link>
                    <Link to="/add-money" className="text-gray-600 hover:text-blue-600 font-medium transition">
                        Add Money
                    </Link>
                    
                    <Button 
                        variant="secondary" 
                        onClick={handleLogout} 
                        className="cursor-pointer ml-2"
                    >
                        Logout
                    </Button>
                </>
            ) : (
                // 🌟 SHOW THIS WHEN GUEST (LOGGED OUT)
                <>
                    <Button 
                        variant="secondary" 
                        className="cursor-pointer" 
                        onClick={() => navigate("/login")}
                    >
                        Login
                    </Button>
                    <Button 
                        onClick={() => navigate("/register")} 
                        className="cursor-pointer"
                    >
                        Register 
                    </Button>
                </>
            )}
        </div>
    </nav>
  );
};

export default NavBar;