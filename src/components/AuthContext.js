import React, { createContext, useState, useContext, useEffect } from "react";
import { ChatContextProvider } from "./ChatContext";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // New loading state

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
    setLoading(false); // Set loading to false after the check
  }, []);

  const login = (email, password) => {
    if (email === "user@example.com" && password === "password123") {
      const userData = { email };
      setUser(userData);
      setIsAuthenticated(true);

      // Save user data to localStorage
      localStorage.setItem("user", JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);

    // Remove user data from localStorage
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, logout, loading }}
    >
      <ChatContextProvider>{children}</ChatContextProvider>
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// ProtectedRoute.js
