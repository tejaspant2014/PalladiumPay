import NavBar from "../components/NavBar";
import Button from "../components/Button";
import Card from "../components/Card";

const Landing = () => {
    return (
        <>

            {/* Hero */}
            <section className="max-w-7xl mx-auto px-8 py-20 flex items-center justify-between gap-16">

                <div className="flex-1">

                    <span className="px-4 py-2 rounded-full bg-blue-100 text-blue-600 font-medium">
                        AI Powered Secure Payments
                    </span>

                    <h1 className="text-6xl font-bold mt-6 leading-tight">
                        Smart Payments <br />
                        Protected by <span className="text-blue-600">AI.</span>
                    </h1>

                    <p className="text-gray-600 text-lg mt-6 max-w-xl leading-8">
                        Palladium Pay is a modern digital payment platform that
                        combines instant money transfers with real-time machine
                        learning fraud detection, ensuring every transaction is
                        fast, secure and intelligent.
                    </p>

                    <div className="flex gap-4 mt-10">
                        <Button>Get Started</Button>
                        <Button variant="secondary">
                            Learn More
                        </Button>
                    </div>

                </div>

                {/* Hero Illustration */}
                <div className="flex-1 flex justify-center">

                    <div className="w-[450px] h-[500px] rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 shadow-xl flex items-center justify-center">

                        <img src= "/heroMockup.png" alt="" className="w-[450px] h-[500px] " />

                    </div>

                </div>

            </section>

            {/* Features */}

            <section className="max-w-7xl mx-auto px-8 py-20">

                <h2 className="text-4xl font-bold text-center">
                    Why Choose Palladium Pay?
                </h2>

                <p className="text-gray-600 text-center mt-4 mb-16">
                    Built with security first while delivering a seamless
                    payment experience.
                </p>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

                    <Card hover>
                        <div className="text-5xl mb-4">🤖</div>

                        <h3 className="text-2xl font-semibold">
                            AI Fraud Detection
                        </h3>

                        <p className="mt-4 text-gray-600">
                            Every transaction is evaluated by a machine
                            learning model before being processed.
                        </p>
                    </Card>

                    <Card hover>
                        <div className="text-5xl mb-4">⚡</div>

                        <h3 className="text-2xl font-semibold">
                            Instant Transfers
                        </h3>

                        <p className="mt-4 text-gray-600">
                            Transfer funds within seconds using a secure
                            digital wallet.
                        </p>
                    </Card>

                    <Card hover>
                        <div className="text-5xl mb-4">🔐</div>

                        <h3 className="text-2xl font-semibold">
                            OTP Security
                        </h3>

                        <p className="mt-4 text-gray-600">
                            Registration and high-risk transactions are
                            protected with OTP verification.
                        </p>
                    </Card>

                    <Card hover>
                        <div className="text-5xl mb-4">📊</div>

                        <h3 className="text-2xl font-semibold">
                            Smart Risk Engine
                        </h3>

                        <p className="mt-4 text-gray-600">
                            High-risk payments trigger additional
                            authentication or are blocked automatically.
                        </p>
                    </Card>

                </div>

            </section>

            {/* How it works */}

            <section className="bg-gray-50 py-24">

                <div className="max-w-7xl mx-auto px-8">

                    <h2 className="text-4xl font-bold text-center">
                        How It Works
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-16 relative">
    {[
        "Create Account",
        "Verify OTP",
        "Add Money",
        "Send Payment",
        "AI Verification"
    ].map((step, index) => (
        <div key={index} className="flex items-center w-full">
            <Card className="w-full text-center p-8 bg-gradient-to-b from-slate-50 to-white border border-slate-200/60 rounded-xl hover:border-blue-500/50 transition-all">
                {/* Visual Pill Icon Placeholder */}
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-4 font-semibold shadow-sm shadow-blue-200">
                    {index + 1}
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                    {step}
                </h3>
            </Card>
            
            {/* Desktop Connector Arrow (Hides on last item) */}
            {index < 4 && (
                <div className="hidden md:flex items-center text-slate-300 mx-1 animate-pulse">
                    →
                </div>
            )}
        </div>
    ))}
</div>

                </div>

            </section>

            {/* CTA */}

            <section className="max-w-7xl mx-auto px-8 py-24">

                <div className="rounded-3xl bg-blue-600 text-white p-16 text-center">

                    <h2 className="text-5xl font-bold">
                        Payments made smarter.
                    </h2>

                    <p className="mt-6 text-xl text-blue-100">
                        Experience instant transactions backed by intelligent
                        fraud detection.
                    </p>

                    <div className="mt-10">
                        <Button>
                            Create Free Account
                        </Button>
                    </div>

                </div>

            </section>

        </>
    );
};

export default Landing;