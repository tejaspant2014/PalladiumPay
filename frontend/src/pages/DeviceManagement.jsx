import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Laptop,
    Smartphone,
    Tablet,
    Monitor,
    Trash2,
    ShieldAlert,
    ChevronDown,
    ShieldCheck,
} from "lucide-react";

import api from "../services/api";

const DevicesManagement = () => {
    const navigate = useNavigate();

    const [devices, setDevices] = useState([]);
    const [nextCursor, setNextCursor] = useState(null);

    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const [revokingId, setRevokingId] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                setLoading(true);

                const { data } = await api.get("/device?limit=20");

                setDevices(data.data.devices || []);
                setNextCursor(data.data.nextCursor);
            } catch (err) {
                console.error(err);
                setError(
                    err?.response?.data?.message ||
                        "Unable to fetch trusted devices."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchDevices();
    }, []);

    const handleLoadMore = async () => {
        if (!nextCursor) return;

        try {
            setLoadingMore(true);

            const { data } = await api.get(
                `/device?limit=20&cursor=${nextCursor}`
            );

            setDevices((prev) => [...prev, ...data.data.devices]);
            setNextCursor(data.data.nextCursor);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingMore(false);
        }
    };

    const handleRevoke = async (id) => {
        const confirmRevoke = window.confirm(
            "Remove this trusted device?"
        );

        if (!confirmRevoke) return;

        try {
            setRevokingId(id);

            await api.post(`/device/${id}`);

            setDevices((prev) =>
                prev.filter((device) => device._id !== id)
            );

            setSuccess("Device revoked successfully.");

            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error(err);

            setError(
                err?.response?.data?.message ||
                    "Unable to revoke device."
            );

            setTimeout(() => setError(""), 3000);
        } finally {
            setRevokingId(null);
        }
    };

    const getDeviceIcon = (device) => {
        const type = `${device.deviceType || ""} ${device.os || ""} ${
            device.browser || ""
        }`.toLowerCase();

        if (
            type.includes("phone") ||
            type.includes("mobile")
        ) {
            return (
                <Smartphone
                    size={24}
                    className="text-gray-600"
                />
            );
        }

        if (
            type.includes("tablet") ||
            type.includes("ipad")
        ) {
            return (
                <Tablet
                    size={24}
                    className="text-gray-600"
                />
            );
        }

        if (
            type.includes("desktop") ||
            type.includes("windows") ||
            type.includes("mac")
        ) {
            return (
                <Monitor
                    size={24}
                    className="text-gray-600"
                />
            );
        }

        return (
            <Laptop
                size={24}
                className="text-gray-600"
            />
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <p className="text-lg font-semibold animate-pulse">
                    Loading trusted devices...
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-10 px-6">

            <div className="max-w-5xl mx-auto">

                <button
                    onClick={() => navigate("/profile")}
                    className="flex items-center gap-2 text-gray-600 hover:text-black mb-6 cursor-pointer"
                >
                    <ArrowLeft size={18} />
                    Back to Profile
                </button>

                <div className="flex items-center gap-4 mb-8">

                    <div className="bg-indigo-100 p-4 rounded-2xl">
                        <ShieldCheck
                            size={40}
                            className="text-indigo-600"
                        />
                    </div>

                    <div>

                        <h1 className="text-4xl font-bold">
                            Trusted Devices
                        </h1>

                        <p className="text-gray-600 mt-1">
                            Manage devices that can access your Palladium account.
                        </p>

                    </div>

                </div>

                {success && (
                    <div className="mb-6 rounded-xl bg-green-50 border border-green-200 text-green-700 px-5 py-4">
                        {success}
                    </div>
                )}

                {error && (
                    <div className="mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 px-5 py-4">
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 divide-y">

                    {devices.length === 0 ? (
                        <div className="p-12 flex flex-col items-center">

                            <ShieldAlert
                                size={60}
                                className="text-indigo-600 mb-5"
                            />

                            <h2 className="text-2xl font-semibold">
                                No trusted devices
                            </h2>

                            <p className="text-gray-500 mt-2 text-center">
                                Your account currently has no active trusted
                                devices.
                            </p>

                        </div>
                    ) : (
                        devices.map((device) => (
                            <div
                            key={device._id}
                            className="p-6 flex items-center justify-between hover:bg-gray-50 transition"
                        >
                            <div className="flex items-center gap-5">

                                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                                    {getDeviceIcon(device)}
                                </div>

                                <div>

                                    <div className="flex items-center gap-3 flex-wrap">

                                        <h2 className="font-semibold text-lg">
                                            {device.deviceName || "Unknown Device"}
                                        </h2>

                                        {device.current && (
                                            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                                                Current Device
                                            </span>
                                        )}

                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                device.trusted
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-yellow-100 text-yellow-700"
                                            }`}
                                        >
                                            {device.trusted
                                                ? "Trusted"
                                                : "Untrusted"}
                                        </span>

                                    </div>

                                    <p className="text-sm text-gray-500 mt-2">
                                        Last Activity:{" "}
                                        {new Date(
                                            device.updatedAt ||
                                                device.createdAt
                                        ).toLocaleString()}
                                    </p>

                                    <p className="text-sm text-gray-500">
                                        Login Count:{" "}
                                        {device.loginCount ?? 0}
                                    </p>

                                    <p className="text-xs font-mono text-gray-400 mt-1">
                                        {device.ipAddress || "Unknown IP"}
                                    </p>

                                </div>

                            </div>

                            <button
                                disabled={revokingId === device._id}
                                onClick={() => handleRevoke(device._id)}
                                className="cursor-pointer p-3 rounded-xl border border-red-100 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                            >
                                <Trash2 size={18} />
                            </button>

                        </div>
                    ))
                )}

            </div>

            {nextCursor && (
                <div className="flex justify-center mt-8">

                    <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="cursor-pointer px-6 py-3 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                    >
                        {loadingMore ? (
                            "Loading..."
                        ) : (
                            <>
                                Load More
                                <ChevronDown size={18} />
                            </>
                        )}
                    </button>

                </div>
            )}

            <div className="mt-10 rounded-3xl bg-blue-50 border border-blue-200 p-8">

                <h2 className="text-xl font-bold text-blue-800 mb-4">
                    Security Tips
                </h2>

                <ul className="space-y-3 text-blue-700 list-disc ml-5">

                    <li>
                        Remove devices that you no longer own or use.
                    </li>

                    <li>
                        Never trust devices on public or shared computers.
                    </li>

                    <li>
                        Change your password immediately if you notice an
                        unfamiliar device.
                    </li>

                    <li>
                        Enable email and phone verification to keep your
                        account secure.
                    </li>

                </ul>

            </div>

        </div>

    </div>
);
};

export default DevicesManagement;