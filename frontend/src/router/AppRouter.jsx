import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoutes.jsx";
import Landing from "../pages/Landing.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Devices from "../pages/Devices.jsx";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import Transactions from "../pages/Transactions.jsx";
import Transfer from "../pages/Transfer.jsx";
import VerifyOTP from "../pages/VerifyOTP.jsx";
import NavBar from "../components/NavBar.jsx";
import Footer from "../components/Footer.jsx";
import VerifyEmail from "../pages/VerifyEmail.jsx";
import VerifyPhone from "../pages/VerifyPhone.jsx";

const AppRouter = () => {
    return (
        <BrowserRouter>
            <NavBar/>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/verify-phone" element={<VerifyPhone />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/transfer" element={<Transfer />} />
                </Route>
                <Route element={<ProtectedRoute />}>
                    <Route path="/transactions" element={<Transactions />} />
                </Route>
                <Route element={<ProtectedRoute />}>
                    <Route path="/devices" element={<Devices />} />
                </Route>
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                </Route>

            </Routes>
            <Footer/>
        </BrowserRouter>
    );
};

export default AppRouter