import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoutes.jsx";
import Landing from "../pages/Landing.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Devices from "../pages/Devices.jsx";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import TransferHistory from "../pages/TransferHistory.jsx";
import Transfer from "../pages/Transfer.jsx";
import TransactionDetails from "../pages/TransactionDetails.jsx";
import NavBar from "../components/NavBar.jsx";
import Footer from "../components/Footer.jsx";
import VerifyEmail from "../pages/VerifyEmail.jsx";
import VerifyPhone from "../pages/VerifyPhone.jsx";
import ForgotPassword from "../pages/ForgotPassword.jsx";
import ChangePassword from "../pages/ChangePassword.jsx";
import CreateWallet from "../pages/CreateWallet.jsx";
import Wallet from "../pages/Wallet.jsx";
import AddMoney from "../pages/AddMoney.jsx";
import VerifyTransferOTP from "../pages/VerifyTransferOTP.jsx";
import DevicesManagement from "../pages/DeviceManagement.jsx";

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
                <Route path="/forgot-password" element={<ForgotPassword/>}/>

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/transfer" element={<Transfer />} />
                </Route>
                <Route element={<ProtectedRoute />}>
                    <Route path="/transactions" element={<TransferHistory />} />
                </Route>
                <Route element={<ProtectedRoute />}>
                    <Route path="/verify-transfer/:transactionId" element={<VerifyTransferOTP />} />
                </Route>
                <Route element={<ProtectedRoute />}>
                    <Route path="/devices" element={<Devices />} />
                </Route>
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                </Route>
                <Route element={<ProtectedRoute />}>
                    <Route path="/device-management" element={<DevicesManagement />} />
                </Route>
                <Route element={<ProtectedRoute />}>
                    <Route path="/change-password" element={<ChangePassword />} />
                </Route>
                <Route element={<ProtectedRoute />}>
                    <Route path="/create-wallet" element={<CreateWallet />} />
                </Route>
                <Route element={<ProtectedRoute />}>
                    <Route path="/wallet" element={<Wallet />} />
                </Route>
                <Route element={<ProtectedRoute />}>
                    <Route path="/add-money" element={<AddMoney />} />
                </Route>
                <Route element={<ProtectedRoute />}>
                <Route path="/transactions/:transactionId" element={<TransactionDetails />} />
                </Route>
                
            </Routes>
            <Footer/>
        </BrowserRouter>
    );
};

export default AppRouter