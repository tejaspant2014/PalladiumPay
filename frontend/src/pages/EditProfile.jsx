import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const EditProfile = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        country: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get("/users/me");
                setForm(data.data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError("");

        try {
            const { data } = await api.patch("/users/update-profile", {
                name: form.name,
                email: form.email,
                phone: form.phone,
            });

            login(data.data);

            navigate("/profile");

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to update profile."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-6 py-10">

            <Card className="w-full max-w-2xl">

                <h1 className="text-3xl font-bold mb-8">
                    Edit Profile
                </h1>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                >

                    <Input
                        label="Name"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                    />

                    <Input
                        label="Email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                    />

                    <Input
                        label="Phone"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                    />

                    <Input
                        label="Country"
                        value={form.country}
                        disabled
                    />

                    {error && (
                        <p className="text-red-500">
                            {error}
                        </p>
                    )}

                    <div className="flex gap-4">

                        <Button
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>

                        <Button
                            type="button"
                            onClick={() => navigate("/profile")}
                        >
                            Cancel
                        </Button>

                    </div>

                </form>

            </Card>

        </div>
    );
};

export default EditProfile;