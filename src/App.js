import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./components/AuthContext";
import LoginPage from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";
import { MathJaxContext } from "better-react-mathjax";
import VerifyOtp from "./components/VerifyOtp";
import { getDataFromLocalStorage } from "./utils/LocalStorageOps";
import { Layout } from "./components/Layout";

function App() {
  const { USER, ACCESS_KEY } = getDataFromLocalStorage() || {};
  console.log(USER, ACCESS_KEY);
  return (
    <MathJaxContext>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/login"
              element={
                USER && ACCESS_KEY ? (
                  <Navigate to="/home" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </MathJaxContext>
  );
}

export default App;
