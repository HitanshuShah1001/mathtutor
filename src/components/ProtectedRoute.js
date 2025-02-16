import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { getDataFromLocalStorage } from "../utils/LocalStorageOps";

const ProtectedRoute = ({ children }) => {
  const { USER, ACCESS_KEY } = getDataFromLocalStorage();
  useEffect(() => {
    getDataFromLocalStorage();
  },[ACCESS_KEY])
  if (!USER || !ACCESS_KEY) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
