import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  API_SEND_OTP,
  BASE_URL_API,
  OTP_VERIFY,
  USER,
} from "../constants/constants";
import { AuthContext } from "../utils/AuthContext";
import { getRequest } from "../utils/ApiCall";

export const getInitialChats = async () => {
  const access = localStorage.getItem("accessKey");
  const headers = {
    Authorization: access,
  };
  const params = {
    userId: 3,
    messages: 100,
    limit: 1000,
  };
  const result = await getRequest(
    `${BASE_URL_API}/chat/getPaginatedChats`,
    headers,
    params
  );
  return result.chats;
};

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
      const response = await axios.post(
        `${BASE_URL_API}/${API_SEND_OTP}`,
        data,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      console.log(response, "response received");
      return true;
    } catch (error) {
      alert(error?.response?.data?.message ?? "Some error occured");
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
      console.log(response, "response");
      return true;
    } catch (error) {
      alert(error?.response?.data?.message ?? "Some error occured");
      return false;
    }
    // const { accessToken, userData } = response.data;
    // const chats = await getInitialChats();
    // setChats(chats);
    // // Save accessKey in sessionStorage
    // localStorage.setItem(ACCESS_KEY, accessToken);

    // // Save user data to localStorage for persistence
    // localStorage.setItem(USER, JSON.stringify({ userData }));

    // // Set user state and mark as authenticated
    // setUser(userData);
    // setIsAuthenticated(true);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);

    // Remove user data and accessKey
    localStorage.removeItem("user");
    sessionStorage.removeItem("accessKey");
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
        chatId,
        setchatId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
