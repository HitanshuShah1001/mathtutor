/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState } from "react";
import { LockIcon, MailIcon } from "lucide-react";
import { useAuth } from "../utils/AuthContext";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [isHovered, setIsHovered] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Attempt to log in
    if (login(email, password)) {
      // Redirect to home page on successful login
      navigate("/home");
    } else {
      // Show error message for failed login
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-['Inter', sans-serif] p-4">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-2xl rounded-2xl p-8 space-y-6 transition-all duration-300 transform hover:scale-105"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Welcome To MathTutor
            </h2>
            <p className="text-gray-500">Sign in to continue</p>
          </div>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              {error}
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MailIcon className="text-gray-400" size={20} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockIcon className="text-gray-400" size={20} />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
            />
          </div>

          <button
            type="submit"
            className={`w-full py-3 rounded-lg text-white font-semibold transition-all duration-300 
              ${
                isHovered
                  ? "bg-blue-600 hover:bg-blue-700 transform hover:scale-105"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
          >
            Sign In
          </button>

          <div className="text-center">
            <a
              href="#"
              className="text-blue-500 hover:text-blue-600 transition-colors duration-300"
            >
              Forgot password?
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
