import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./components/AuthContext";
import { MathJaxContext } from "better-react-mathjax";
import { getDataFromLocalStorage } from "./utils/LocalStorageOps";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";
import { QUESTION_PAPER_LIST } from "./constants/pages";

// Lazy loaded components
const LoginPage = lazy(() => import("./components/Login"));
const VerifyOtp = lazy(() => import("./components/VerifyOtp"));
const UpdateUserDetails = lazy(() => import("./components/UpdateUserDetails"));
const ResultAnalyser = lazy(() => import("./components/ResultVisualiser"));
const SelectStandard = lazy(() =>
  import("./components/SelectStandardAndGrade")
);
const DocumentSidebar = lazy(() => import("./components/DocumentList"));
const GenerateQuestionPaper = lazy(() => import("./components/Questionpaper"));
const QuestionBank = lazy(() => import("./components/QuestionBank"));
const QuestionPaperEditPage = lazy(() =>
  import("./components/Questionpapereditpage")
);
const CustomPaperCreatePage = lazy(() =>
  import("./components/CustomQuestionPaperGeneration")
);
const BulkQuestionForm = lazy(() => import("./components/BulkQuestionForm"));

function App() {
  const { USER, ACCESS_KEY } = getDataFromLocalStorage() || {};

  return (
    <MathJaxContext>
      <AuthProvider>
        <Router>
          <Suspense fallback={<div>Loading...</div>}>
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
                path="/bulkupload"
                element={
                  <ProtectedRoute>
                    <BulkQuestionForm />
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
                    <Navigate to={QUESTION_PAPER_LIST} replace />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </MathJaxContext>
  );
}

export default App;
