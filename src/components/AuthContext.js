import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { ChatContextProvider } from "./ChatContext";
import {
  ACCESS_KEY,
  API_LOGIN,
  BASE_URL_API,
  USER,
} from "../constants/constants";
import { AuthContext } from "../utils/AuthContext";

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // New loading state

  useEffect(() => {
    const savedUser = localStorage.getItem(USER);
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
    setLoading(false); // Set loading to false after the check
  }, []);

  const login = async (email, password) => {
    const data = JSON.stringify({
      emailId: email,
      password: password,
    });

    try {
      const response = await axios.post(`${BASE_URL_API}${API_LOGIN}`, data, {
        headers: { "Content-Type": "application/json" },
      });
      console.log(response, "response received");
      const { accessToken, userData } = response.data;

      // Save accessKey in sessionStorage
      localStorage.setItem(ACCESS_KEY, accessToken);

      // Save user data to localStorage for persistence
      localStorage.setItem(USER, JSON.stringify({ userData }));

      // Set user state and mark as authenticated
      setUser(userData);
      setIsAuthenticated(true);

      return true;
    } catch (error) {
      alert(error.response.data.message ?? "Some error occured");
      return false;
    }
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
      value={{ isAuthenticated, user, login, logout, loading }}
    >
      <ChatContextProvider>{children}</ChatContextProvider>
    </AuthContext.Provider>
  );
};
