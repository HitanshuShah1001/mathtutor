// src/contexts/AuthContext.js
import React, { createContext, useState, useContext } from 'react';

// Create an authentication context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Mock login function (replace with your actual authentication logic)
  const login = (email, password) => {
    // Simple mock authentication (replace with real authentication)
    if (email === 'user@example.com' && password === 'password123') {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  // Logout function
  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};