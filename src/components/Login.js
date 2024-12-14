/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState } from "react";
import { PhoneIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";

const LoginPage = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [isHovered, setIsHovered] = useState(false);

  const navigate = useNavigate();
  const { requestOtp } = useAuth(); // Make sure you have a requestOTP function in your AuthContext

  const handleSubmit = async (e) => {
    e.preventDefault();
    const indianPhoneRegex = /^[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(phoneNumber)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
    } else {
      setError("");
      const isOTPSent = await requestOtp(phoneNumber);
      // const isOTPSent = awa;
      if (isOTPSent) {
        navigate("/verify-otp");
      } else {
        setError(
          "Unable to send OTP. Please check the phone number and try again."
        );
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-['Inter', sans-serif] p-4">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-2xl rounded-2xl p-8 space-y-6 transition-all duration-300 transform hover:scale-105"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Welcome To MathTutor
            </h2>
            <p className="text-gray-500">Enter your phone number to continue</p>
          </div>
          {error && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <PhoneIcon className="text-gray-400" size={20} />
            </div>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Your 10 Digit Phone Number"
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
            />
          </div>

          <button
            type="submit"
            className={`w-full py-3 rounded-lg text-white font-semibold transition-all duration-300 
              ${
                isHovered
                  ? "bg-blue-600 hover:bg-blue-700 transform hover:scale-105"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
          >
            Get OTP
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
