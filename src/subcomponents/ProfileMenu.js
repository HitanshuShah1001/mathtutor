import React, { useState } from 'react';
import { UserIcon, SettingsIcon, LogOutIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const ProfileMenu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    // Set a higher z-index on the container
    <div className="relative z-[100]">
      <button 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="rounded-full bg-gray-200 p-2 hover:bg-gray-300 transition-colors"
      >
        <UserIcon size={24} />
      </button>

      {isMenuOpen && (
        <div 
          className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg border"
          style={{ zIndex: 2000 }} // ensures the dropdown is above sibling elements
        >
          <div 
            className="flex items-center p-3 hover:bg-gray-100 cursor-pointer"
            onClick={() => {/* Open Settings */}}
          >
            <SettingsIcon className="mr-2" size={18} />
            Settings
          </div>
          <div 
            className="flex items-center p-3 hover:bg-gray-100 cursor-pointer text-red-600"
            onClick={handleLogout}
          >
            <LogOutIcon className="mr-2" size={18} />
            Logout
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
