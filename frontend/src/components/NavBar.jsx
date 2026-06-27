import React from 'react'
import Button from './Button.jsx'
import { useNavigate, Link } from 'react-router-dom';
const NavBar = () => {
  const logoSrc = "/logo.png"; 
  const navigate = useNavigate();
  return (
    <nav className="flex justify-between items-center w-full max-w-7xl mx-auto px-6 py-4">
        {/* Logo Section */}
        <div className="flex items-center">
            <Link to="/" className="cursor-pointer hover:opacity-80 transition">
                <img 
                  src={logoSrc} 
                  alt="Palladium Pay Logo" 
                  className="w-auto h-12 object-contain"
                />
            </Link>
        </div>

        {/* Buttons Section */}
        <div className="flex items-center gap-4">
            <Button variant="secondary" className="cursor-pointer " onClick={() => navigate("/login")}>
               Login
              </Button>
            <Button onClick={() => navigate("/register")} className='cursor-pointer'>
            Register 
            </Button>
        </div>
    </nav>
  )
}

export default NavBar