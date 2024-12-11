import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./components/AuthContext";
import LoginPage from "./components/Login";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";
import { MathJaxContext } from "better-react-mathjax";
import GenerateQuestionPaper from "./components/Questionpaper";

function App() {
  return (
    <MathJaxContext>
      
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <GenerateQuestionPaper />
                  </ProtectedRoute>
                }
              />
              {/* Redirect to login by default */}
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
    </MathJaxContext>
  );
}

export default App;
