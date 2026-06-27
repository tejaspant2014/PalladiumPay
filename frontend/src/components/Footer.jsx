import React from "react";
const Footer = () => {
    return (
        <footer className="mt-10 border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-8 py-10">

                <div className="flex flex-col md:flex-row justify-between gap-10">

                    {/* Left */}

                    <div className="max-w-md">
                        <img
                            src="/logo.png"
                            alt="Palladium Pay"
                            className="w-52 mb-4"
                        />

                        <p className="text-gray-600 leading-7">
                            A full-stack digital payments platform built with
                            React, Node.js, Express, MongoDB and an ML-powered
                            fraud detection pipeline for secure transactions.
                        </p>
                    </div>

                    {/* Right */}

                    <div>

                        <h3 className="font-semibold text-lg mb-4">
                            Project
                        </h3>

                        <ul className="space-y-3 text-gray-600">
                            <li className="hover:text-blue-600 cursor-pointer">
                                <a href="https://github.com/tejaspant2014/PalladiumPay" target="blank"> GitHub Repository </a> 
                            </li>
                            <li className="hover:text-blue-600 cursor-pointer">
                                <a href="https://www.linkedin.com/in/tejas-pant-818611320/" target="blank"> LinkedIn </a> 
                            </li>
                        </ul>

                    </div>

                </div>

                <div className="border-t border-gray-200 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">

                    <p className="text-gray-500 text-sm">
                        Built by <span className="font-medium">Tejas Pant</span> • React • Express • MongoDB • Machine Learning
                    </p>

                    <p className="text-gray-500 text-sm mt-3 md:mt-0">
                        © 2026 Palladium Pay
                    </p>

                </div>

            </div>
        </footer>
    );
};

export default Footer;