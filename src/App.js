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
import { UpdateUserDetails } from "./components/UpdateUserDetails";
import { ResultAnalyser } from "./components/ResultVisualiser";
import { SelectStandard } from "./components/SelectStandardAndGrade";
import { DocumentSidebar } from "./components/DocumentList";
import GenerateQuestionPaper from "./components/Questionpaper";
import QuestionBank from "./components/QuestionBank";
import QuestionPaperEditPage from "./components/Questionpapereditpage";
import { CustomPaperCreatePage } from "./components/CustomQuestionPaperGeneration";

function App() {
  const { USER, ACCESS_KEY } = getDataFromLocalStorage() || {};
  return (
    <MathJaxContext>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route
              path="/update-user-details"
              element={<UpdateUserDetails />}
            />
            <Route
              path="/"
              element={<Navigate to="/question-paper-generation" replace />}
            />

            <Route
              path="/question-paper-generation"
              element={
                <ProtectedRoute>
                  <GenerateQuestionPaper />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report-analyser"
              element={
                <ProtectedRoute>
                  <ResultAnalyser />
                </ProtectedRoute>
              }
            />
            <Route
              path="/question-paper-list"
              element={
                <ProtectedRoute>
                  <DocumentSidebar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/question-bank"
              element={
                <ProtectedRoute>
                  <QuestionBank />
                </ProtectedRoute>
              }
            />
            <Route
              path="/custom-question-paper-generation"
              element={
                <ProtectedRoute>
                  <CustomPaperCreatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/select-standard-and-file"
              element={<SelectStandard />}
            />
            <Route
              path="/edit-document/:docId"
              element={<QuestionPaperEditPage />}
            />
            <Route
              path="/login"
              element={
                USER && ACCESS_KEY ? (
                  <Navigate to="/question-paper-generation" replace />
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
