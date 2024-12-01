// src/components/Home.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import ChatContainer from './ChatContainer';

const Home = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <ChatContainer />
    // <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
    //   <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full text-center">
    //     <h1 className="text-3xl font-bold mb-4 text-gray-800">Welcome to the Home Page</h1>
    //     <p className="text-gray-600 mb-6">You have successfully logged in!</p>
    //     <button 
    //       onClick={handleLogout}
    //       className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-300"
    //     >
    //       Logout
    //     </button>
    //   </div>
    // </div>
  );
};

export default Home;