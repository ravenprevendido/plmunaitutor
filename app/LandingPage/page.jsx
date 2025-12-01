'use client';

import { Button } from "@/components/ui/button";
import { SignIn, SignUp } from "@clerk/nextjs";
import Image from "next/image";
import { useState } from "react";
import LandingFooter from "./components/LandingFooter";
import LandingHome from "./components/landing";

export default function LandingPage() {
    const [showSignIn, setShowSignIn] = useState(null);

    const closeModal = () => {
        setShowSignIn(null);
    };

    return (
        <div className="min-h-screen bg-[#1d1f2b] text-white flex flex-col justify-between overflow-hidden">
            {/* Landing Page Header */}
            <LandingHome setShowSignIn={setShowSignIn} />
            {/* Footer */}
            <LandingFooter />
            
            {/* Modal for Sign-In / Sign-Up */}
            {showSignIn !== null && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-50"
                    onClick={closeModal}
                >
                    <div
                        className="relative p-6 rounded-lg shadow-lg"
                        onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
                    >
                        {/* Close Button */}
                        <button
                            className="absolute top-2 right-2 text-white text-xl"
                            onClick={closeModal}
                        >
                         
                        </button>
                        {/* Sign-In / Sign-Up Forms - WALANG onSignIn at onSignUp */}
                        {showSignIn === 'sign-in' && (
                            <SignIn routing="virtual" />
                        )}
                        {showSignIn === 'sign-up' && (
                            <SignUp routing="virtual" />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}