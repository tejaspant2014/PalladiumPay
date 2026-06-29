import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Laptop, Smartphone, Tablet, Monitor, Trash2, ShieldAlert, ChevronDown } from "lucide-react";
import api from "../services/api";

const DevicesManagement = () => {
    const navigate = useNavigate();

    const [devices, setDevices] = useState([]);
    const [nextCursor, setNextCursor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [revokingId, setRevokingId] = useState(null);
    const [error, setError] = useState(null);

    // Fetch initial list of devices
    useEffect(() => {
        const fetchInitialDevices = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await api.get("/device?limit=20");
                if (res.data.data?.devices) {
                    setDevices(res.data.data.devices);
                    setNextCursor(res.data.data.nextCursor);
                }
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.message || "Failed to load active devices.");
            } finally {
                setLoading(false);
            }
        };

        fetchInitialDevices();
    }, []);

    // Load more pagination logic
    const handleLoadMore = async () => {
        if (!nextCursor || loadingMore) return;

        try {
            setLoadingMore(true);
            const res = await api.get(`/device?limit=20&cursor=${nextCursor}`);
            if (res.data.data?.devices) {
                setDevices((prev) => [...prev, ...res.data.data.devices]);
                setNextCursor(res.data.data.nextCursor);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingMore(false);
        }
    };

    // Revoke a device handler
    const handleRevokeDevice = async (deviceId) => {
        if (!window.confirm("Are you sure you want to log out of this device?")) return;

        try {
            setRevokingId(deviceId);
            setError(null);
            await api.post(`/device/${deviceId}`); 
            
            // Remove the revoked device from UI state seamlessly
            setDevices((prev) => prev.filter((d) => d._id !== deviceId));
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Could not revoke this device.");
        } finally {
            setRevokingId(null);
        }
    };

    // Helper to render responsive machine type icons based on dynamic agent properties
    const getDeviceIcon = (deviceType = "") => {
        const type = deviceType.toLowerCase();
        if (type.includes("phone" || "mobile")) return <Smartphone size={24} className="text-gray-500" />;
        if (type.includes("tablet" || "ipad")) return <Tablet size={24} className="text-gray-500" />;
        if (type.includes("desktop" || "windows" || "mac")) return <Monitor size={24} className="text-gray-500" />;
        return <Laptop size={24} className="text-gray-500" />;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-lg font-medium text-gray-600 animate-pulse">Scanning secure active sessions...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                
                {/* Header Section */}
                <div className="mb-8">
                    <button 
                        onClick={() => navigate("/dashboard")} 
                        className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition gap-2 mb-3 cursor-pointer"
                    >
                        <ArrowLeft size={16} />
                        Back to Dashboard
                    </button>
                    <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                        <ShieldAlert size={36} className="text-indigo-600" />
                        Device Management
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Review and manage devices currently authorized to access your Palladium Pay wallet dashboard.
                    </p>
                </div>
                {/* Shared Error UI */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl">
                        {error}
                    </div>
                )}

                {/* Devices Container Grid/Stack */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm divide-y divide-gray-100">
                    {devices.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 font-medium">
                            No other active device profiles recorded.
                        </div>
                    ) : (
                        devices.map((device) => (
                            <div key={device._id} className="p-5 flex items-center justify-between transition hover:bg-gray-50/60">
                                
                                {/* Info Metadata Display */}
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gray-100 rounded-xl border border-gray-200/50">
                                        {getDeviceIcon(device.deviceType || device.os || device.browser)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-800">
                                                {device.deviceName || "Unknown System Hardware"}
                                            </h3>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Last Activity: {new Date(device.updatedAt || device.createdAt).toLocaleString()}
                                        </p>
                                        <p className="text-xs font-mono text-gray-500 mt-1">
                                            IP: {device.ipAddress || "0.0.0.0"}
                                        </p>
                                    </div>
                                </div>

                                {/* Action Buttons (Intercepting dynamic status blocks) */}
                                <div>
                                    <button
                                        onClick={() => handleRevokeDevice(device._id)}
                                        disabled={revokingId === device._id}
                                        className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition border border-transparent hover:border-red-100 cursor-pointer disabled:opacity-50"
                                        title="Revoke Session Access"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                            </div>
                        ))
                    )}
                </div>

                {/* Cursor Pagination Load More Block */}
                {nextCursor && (
                    <div className="mt-6 flex justify-center">
                        <button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold rounded-xl text-sm shadow-sm transition disabled:opacity-60 cursor-pointer"
                        >
                            {loadingMore ? "Loading more session objects..." : <>Show More Devices <ChevronDown size={16} /></>}
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default DevicesManagement;