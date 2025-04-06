/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useContext, useState, useEffect } from "react";
import { KeyIcon } from "lucide-react";
import { AuthContext, useAuth } from "../utils/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import {
  addDataToLocalStorage,
  removeDataFromLocalStorage,
} from "../utils/LocalStorageOps";
import { QUESTION_PAPER_LIST } from "../constants/pages";

const VerifyOtp = () => {
  // Get authentication context values and navigation functions
  const { setIsAuthenticated, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  // Import both verifyOTP and requestOtp from the auth hook
  const { verifyOTP, requestOtp } = useAuth();

  // Extract phone number from location state
  const phoneNumber = location.state?.phoneNumber || "";

  // State for OTP input, error messages, and hover state for the submit button
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isHovered, setIsHovered] = useState(false);

  // State for resend OTP functionality:
  // resendTimer: Countdown timer (in seconds)
  // resendDisabled: Boolean flag to disable the resend button until timer expires
  const [resendTimer, setResendTimer] = useState(60);
  const [resendDisabled, setResendDisabled] = useState(true);

  // Start the resend OTP countdown when the component mounts or when resend is triggered
  useEffect(() => {
    let interval;
    if (resendDisabled) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setResendDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendDisabled]);

  // Handler for form submission to verify the OTP entered by the user
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate that the OTP is a 6-digit number
    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    // Call the verifyOTP function from the auth hook
    const isValidAndData = await verifyOTP(phoneNumber, otp);
    if (isValidAndData?.status) {
      const { accessToken, user } = isValidAndData.data?.data || {};
      removeDataFromLocalStorage();

      // If the user has an email, assume they are fully registered and navigate to paper generation page
      if (user?.emailId) {
        addDataToLocalStorage({ accessToken, user });
        setUser(user);
        setIsAuthenticated(true);
        navigate(QUESTION_PAPER_LIST, { replace: true });
      }
      // } else {
      //   // Otherwise, navigate to update-user-details page for additional registration
      //   addDataToLocalStorage({ accessToken });
      //   navigate("/update-user-details", {
      //     state: { firstTime: true, id: user?.id },
      //   });
      // }
    } else {
      console.log(isValidAndData.data.config);
      setError(isValidAndData?.data?.response?.data?.message);
    }
  };

  /**
   * handleResendOtp:
   * - Validates the phone number.
   * - Calls the requestOtp API to resend the OTP.
   * - If successful, resets the countdown timer.
   */
  const handleResendOtp = async () => {
    setError("");
    const indianPhoneRegex = /^[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(phoneNumber)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    const isOTPSent = await requestOtp(phoneNumber);
    if (isOTPSent) {
      alert("OTP has been resent successfully.");
      // Reset timer and disable resend button
      setResendTimer(60);
      setResendDisabled(true);
    } else {
      setError(
        "Unable to send OTP. Please check the phone number and try again."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-['Inter',sans-serif] p-4">
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
          {/* Resend OTP Section */}
          <div className="text-center mt-4">
            {resendDisabled ? (
              <p className="text-gray-500 text-sm">
                Resend OTP in {resendTimer} second{resendTimer !== 1 && "s"}
              </p>
            ) : (
              // Added type="button" to prevent form submission on click
              <button
                type="button"
                onClick={handleResendOtp}
                className="text-blue-500 underline text-sm"
              >
                Resend OTP
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;
