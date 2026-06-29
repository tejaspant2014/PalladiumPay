import { useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import Input from "../components/Input";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const ChangePassword = () => {
    const { logout } = useAuth(); // Needed to boot them out upon change
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const [form, setForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess(false);

        if (form.newPassword !== form.confirmPassword) {
            return setError("New passwords do not match.");
        }

        setLoading(true);

        try {
            const response = await api.patch("/users/change-password", {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
            });

            if (response.data?.success) {
                setSuccess(true);
                setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                
                // Because device sessions are wiped, clear frontend memory too
                alert("Password changed successfully! Please log in again with your new credentials.");
                logout(); 
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to alter password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto mt-10 px-4">
            <Card className="shadow-lg">
                <h2 className="text-2xl font-bold mb-2">Update Password</h2>
                <p className="text-gray-600 mb-6 text-sm">
                    Ensure your account stays secure by choosing a long, randomized password phrase.
                </p>

                {success && (
                    <p className="mb-4 text-sm text-green-600 font-medium bg-green-50 p-2 rounded border border-green-200">
                        Password updated successfully!
                    </p>
                )}
                {error && (
                    <p className="mb-4 text-sm text-red-600 font-medium bg-red-50 p-2 rounded border border-red-200">
                        {error}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Current Password"
                        name="currentPassword"
                        type="password"
                        value={form.currentPassword}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="New Password"
                        name="newPassword"
                        type="password"
                        value={form.newPassword}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Confirm New Password"
                        name="confirmPassword"
                        type="password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        required
                    />
                    <Button type="submit" className="w-full mt-2" disabled={loading}>
                        {loading ? "Saving Changes..." : "Change Password"}
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default ChangePassword;