import React from 'react';
import { PlusIcon, MessageSquareIcon } from 'lucide-react';

const Sidebar = ({ chats, selectedChat, onSelectChat }) => {
  const handleNewChat = () => {
    // Logic to create a new chat
  };

  return (
    <div className="w-64 bg-gray-900 text-white p-4 flex flex-col">
      {/* New Chat Button */}
      <button 
        onClick={handleNewChat}
        className="flex items-center justify-center bg-gray-700 hover:bg-gray-600 p-2 rounded-md mb-4 transition-colors"
      >
        <PlusIcon className="mr-2" size={20} />
        New Chat
      </button>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <div 
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`
              flex items-center p-2 rounded-md cursor-pointer mb-2 
              ${selectedChat === chat.id 
                ? 'bg-gray-700' 
                : 'hover:bg-gray-800'
              }
            `}
          >
            <MessageSquareIcon className="mr-2" size={20} />
            <span className="truncate">{chat.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;