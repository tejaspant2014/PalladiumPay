import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    User,
    ShieldCheck,
    ShieldX,
    ChevronRight,
    Pencil,
    KeyRound,
    LogOut,
} from "lucide-react";

import Card from "../components/Card";
import Button from "../components/Button";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get("/users/me");
                setUser(data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-xl font-semibold">
                Loading Profile...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-10 px-6">
            <div className="max-w-5xl mx-auto">

                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-blue-100 p-4 rounded-2xl">
                        <User className="text-blue-600" size={40} />
                    </div>

                    <div>
                        <h1 className="text-4xl font-bold">
                            My Profile
                        </h1>

                        <p className="text-gray-600">
                            View your account information.
                        </p>
                    </div>
                </div>

                <Card>

                    <div className="grid md:grid-cols-2 gap-8">

                        <div>
                            <p className="text-sm text-gray-500">Name</p>
                            <p className="font-semibold text-lg">{user?.name}</p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-semibold text-lg">{user?.email}</p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="font-semibold text-lg">{user?.phone}</p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Country</p>
                            <p className="font-semibold text-lg">
                                {user?.country}
                            </p>
                        </div>

                        <div className="flex items-center justify-between">
    <div>
        <p className="text-sm text-gray-500">Email</p>
        <p className="font-semibold">{user.email}</p>
    </div>

    {user.emailVerified ? (
        <span className="text-green-600 font-medium">
            Verified
        </span>
    ) : (
        <button
            onClick={async () => {
                try {
                    await api.post("/users/verify-email/send-otp");
                    navigate("/verify-updated-email");
                } catch (err) {
                    alert(err.message);
                }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
        >
            Verify Email
        </button>
    )}
</div>
<div className="flex items-center justify-between">
    <div>
        <p className="text-sm text-gray-500">Phone</p>
        <p className="font-semibold">{user.phone}</p>
    </div>

    {user.phoneVerified ? (
        <span className="text-green-600 font-medium">
            Verified
        </span>
    ) : (
        <button
            onClick={async () => {
                try {
                    await api.post("/users/verify-phone/send-otp");
                    navigate("/verify-updated-phone");
                } catch (err) {
                    alert(err.response?.data?.message);
                }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
        >
            Verify Phone
        </button>
    )}
</div>

                        <div>
                            <p className="text-sm text-gray-500">Joined</p>

                            <p className="font-semibold">
                                {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">
                                User ID
                            </p>

                            <p className="font-semibold break-all">
                                {user._id}
                            </p>
                        </div>

                    </div>

                </Card>

                <Card
                    hover
                    onClick={() => navigate("/devices")}
                    className="cursor-pointer"
                >
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="font-semibold text-lg">
                                Trusted Devices
                            </h3>
                            <p className="text-gray-500">
                                View and revoke active devices.
                            </p>
                        </div>

                        <ChevronRight />
                    </div>
                </Card>
                <div className="flex flex-wrap gap-4 mt-8">

                    <Button
                        onClick={() => navigate("/edit-profile")}
                        className="flex items-center gap-2"
                    >
                        <Pencil size={18} />
                        Edit Profile
                    </Button>

                    <Button
                        onClick={() => navigate("/change-password")}
                        className="flex items-center gap-2"
                    >
                        <KeyRound size={18} />
                        Change Password
                    </Button>

                    <Button
                        onClick={logout}
                        className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
                    >
                        <LogOut size={18} />
                        Logout
                    </Button>

                </div>

            </div>
        </div>
    );
};

export default Profile;