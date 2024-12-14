/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useContext, useState } from "react";
import { KeyIcon } from "lucide-react";
import { AuthContext, useAuth } from "../utils/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import {
  addDataToLocalStorage,
  removeDataFromLocalStorage,
} from "../utils/LocalStorageOps";

const VerifyOtp = () => {
  const { setIsAuthenticated, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();

  const { verifyOTP } = useAuth();

  const handleSubmit = async (e) => {
    const mobileNumber = location.state?.phoneNumber || "";
    e.preventDefault();
    setError("");

    const otpRegex = /^\d{6}$/;
    if (!otpRegex.test(otp)) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    const isValidAndData = await verifyOTP(mobileNumber, otp);
    if (isValidAndData && isValidAndData.status) {
      const data = isValidAndData.data;
      const { accessToken, user } = data.data || {};
      console.log(user,user.email)
      removeDataFromLocalStorage();
      if (user.emailId) {
        addDataToLocalStorage({ accessToken, user });
        setUser(user);
        setIsAuthenticated(true);
        navigate("/home");
      } else {
        // If user object does not exist, user is first-time and not fully registered
        // Store only the token so we can use it on the next page
        addDataToLocalStorage({ accessToken });
        // Navigate to a page where user can complete their profile
        navigate("/update-user-details", {
          state: { firstTime: true, id: user.id },
        });
      }
    } else {
      setError("Invalid OTP. Please try again.");
      return;
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
              Verify OTP
            </h2>
            <p className="text-gray-500">
              Enter the 6-digit code sent to your phone
            </p>
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
              <KeyIcon className="text-gray-400" size={20} />
            </div>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter your 6-digit OTP"
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
            Verify OTP
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;
