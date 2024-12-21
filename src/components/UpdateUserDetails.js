/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState } from "react";
import { UserIcon, MailIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getDataFromLocalStorage,
  addDataToLocalStorage,
} from "../utils/LocalStorageOps";
import axios from "axios";
import { BASE_URL_API } from "../constants/constants";

export const UpdateUserDetails = () => {
  const location = useLocation();
  const id = location?.state?.id;
  const [name, setName] = useState("");
  const [emailId, setEmailId] = useState("");
  const [error, setError] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const firstTime = location.state?.firstTime || false;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !emailId.trim()) {
      setError("Please enter both name and email.");
      return;
    }

    // Retrieve the accessToken from local storage
    const { ACCESS_KEY } = getDataFromLocalStorage() || {};

    if (!ACCESS_KEY) {
      setError("Session expired or invalid. Please log in again.");
      navigate("/login");
      return;
    }

    const data = JSON.stringify({ name, emailId, id, tokens: 100 });

    try {
      const response = await axios.post(`${BASE_URL_API}/user/update`, data, {
        headers: {
          "Content-Type": "application/json",
          Authorization: ACCESS_KEY,
        },
      });

      const { user } = response.data;
      // Update local storage with user details
      addDataToLocalStorage({ accessToken:ACCESS_KEY, user });

      // Navigate to home after completion
      navigate("/question-paper-generation", { replace: true });
    } catch (err) {
      setError(
        "An error occurred while completing your profile. Please try again."
      );
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
              Complete Your Profile
            </h2>
            {firstTime && (
              <p className="text-gray-500">
                Since this is your first time here, let's get you signed up.
              </p>
            )}
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
              <UserIcon className="text-gray-400" size={20} />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your Name"
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MailIcon className="text-gray-400" size={20} />
            </div>
            <input
              type="email"
              value={emailId}
              onChange={(e) => setEmailId(e.target.value)}
              placeholder="Enter your Email"
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
            Complete Profile
          </button>
        </form>
      </div>
    </div>
  );
};
