import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";

// --- Icons ---
const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
);

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const Spinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export default function Login() {
    const [step, setStep] = useState("phone");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [name, setName] = useState("");
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [confirmationResult, setConfirmationResult] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        AOS.init({ duration: 800, once: true });
    }, []);

    useEffect(() => {
        if (!auth) return;
        try {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
                size: "invisible",
                callback: () => console.log("reCAPTCHA verified"),
            });
        } catch (e) {
            console.error("reCAPTCHA Error:", e);
            setError("Could not initialize login verification. Please refresh.");
        }
    }, []);

    const handlePhoneSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        if (!window.recaptchaVerifier) {
            setError("Verification service not ready. Please try again.");
            setLoading(false);
            return;
        }
        try {
            const fullPhone = `+91${phone}`;
            const result = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
            setConfirmationResult(result);
            setStep("otp");
        } catch (err) {
            console.error(err);
            setError("Failed to send OTP. Please check the number.");
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const userCredential = await confirmationResult.confirm(otp);
            const loggedInUser = userCredential.user;
            const userDocRef = doc(db, "users", loggedInUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                setUser(userDocSnap.data());
                navigate("/");
            } else {
                setUser({ uid: loggedInUser.uid, phone: loggedInUser.phoneNumber });
                setStep("name");
            }
        } catch (err) {
            console.error(err);
            setError("Invalid OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleNameSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const userDocRef = doc(db, "users", user.uid);
            const newUser = {
                uid: user.uid,
                phone: user.phone,
                name,
                role: "user",
                createdAt: serverTimestamp(),
            };
            await setDoc(userDocRef, newUser);
            setUser(newUser);
            navigate("/");
        } catch (err) {
            console.error(err);
            setError("Could not save your name. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case "phone":
                return (
                    <form onSubmit={handlePhoneSubmit} className="w-full space-y-8">
                       
                        <div className="relative border-b-2 border-gray-200 focus-within:border-gray-800 transition">
                            <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                                <PhoneIcon />
                                <span className="text-gray-500 ml-2">+91</span>
                                <div className="h-5 w-px bg-gray-300 mx-2"></div>
                            </div>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                                placeholder="98765 43210"
                                maxLength="10"
                                className="w-full pl-24 pr-3 py-3 bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-800 text-lg"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || phone.length !== 10}
                            className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-transform transform hover:scale-105 flex items-center justify-center shadow-lg disabled:bg-gray-400"
                        >
                            {loading ? <Spinner /> : "Send OTP"}
                        </button>
                    </form>
                );
            case "otp":
                return (
                    <form onSubmit={handleOtpSubmit} className="w-full space-y-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-800">Verify OTP 🔑</h2>
                            <p className="text-gray-500 mt-2">Sent to +91 {phone}</p>
                        </div>
                        <div className="relative border-b-2 border-gray-200 focus-within:border-gray-800 transition">
                            <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                                <LockIcon />
                            </div>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                placeholder="6-digit OTP"
                                maxLength="6"
                                className="w-full pl-8 pr-3 py-3 bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-800 text-lg"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-transform transform hover:scale-105 flex items-center justify-center shadow-lg disabled:bg-gray-400"
                        >
                            {loading ? <Spinner /> : "Verify & Continue"}
                        </button>
                    </form>
                );
            case "name":
                return (
                    <form onSubmit={handleNameSubmit} className="w-full space-y-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-800">Almost done 🎉</h2>
                            <p className="text-gray-500 mt-2">Please tell us your name.</p>
                        </div>
                        <div className="relative border-b-2 border-gray-200 focus-within:border-gray-800 transition">
                            <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                                <UserIcon />
                            </div>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your Full Name"
                                className="w-full pl-8 pr-3 py-3 bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-800 text-lg"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || name.trim() === ""}
                            className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-transform transform hover:scale-105 flex items-center justify-center shadow-lg disabled:bg-gray-400"
                        >
                            {loading ? <Spinner /> : "Complete Sign Up"}
                        </button>
                    </form>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen font-sans bg-white">
            <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
                {/* Left side - Gradient */}
                <div className="hidden lg:block bg-gradient-to-br from-rose-50 to-pink-100  "  data-aos="fade-right">
                    <div className="flex flex-col justify-center items-center h-full p-8 bg-gray-100">
                        <img src="./aryaco.png" alt="Arya & Co." className=" mb-4" />
                    </div>
                </div>

                {/* Right side - Form */}
                <div className="flex flex-col justify-center items-center p-8 sm:p-12 min-h-screen" data-aos="fade-left" data-aos-delay="200">
                    <div className="w-full max-w-sm">
                        <div className="text-left mb-12">
                            <h1 className="text-5xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                                Arya & Co.
                            </h1>

                        </div>

                        {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg text-center mb-6 text-sm">{error}</p>}

                        {renderStep()}
                    </div>
                </div>
            </div>
            <div id="recaptcha-container"></div>
        </div>
    );
}