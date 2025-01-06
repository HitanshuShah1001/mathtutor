import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  API_SEND_OTP,
  BASE_URL_API,
  OTP_VERIFY,
  USER,
} from "../constants/constants";
import { AuthContext } from "../utils/AuthContext";
import { removeDataFromLocalStorage } from "../utils/LocalStorageOps";

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(undefined);
  const [chatId, setchatId] = useState(undefined);

  useEffect(() => {
    const savedUser = localStorage.getItem(USER);
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const requestOtp = async (mobileNumber) => {
    const data = JSON.stringify({
      countryCode: "+91",
      mobileNumber,
    });

    try {
      await axios.post(`${BASE_URL_API}/${API_SEND_OTP}`, data, {
        headers: { "Content-Type": "application/json" },
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  const verifyOTP = async (mobileNumber, otp) => {
    const data = JSON.stringify({
      countryCode: "+91",
      mobileNumber,
      otp,
    });

    try {
      const response = await axios.post(`${BASE_URL_API}/${OTP_VERIFY}`, data, {
        headers: { "Content-Type": "application/json" },
      });
      return { status: true, data: response };
    } catch (error) {
      return { status: false, data: error };
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);

    removeDataFromLocalStorage();
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        requestOtp,
        logout,
        verifyOTP,
        loading,
        chats,
        setChats,
        selectedChat,
        setSelectedChat,
        setIsAuthenticated,
        chatId,
        setchatId,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
