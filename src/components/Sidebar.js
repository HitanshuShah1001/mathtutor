import React, { useContext, useState } from "react";
import {
  PlusIcon,
  MessageSquareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { ASSISTANT } from "../constants/constants";
import { AuthContext } from "../utils/AuthContext";

const Sidebar = () => {
  const { chats, selectedChat, setSelectedChat, setchatId } =
    useContext(AuthContext);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const handleNewChat = () => {
    const newChat = [
      {
        title: `New Chat ${chats.length + 1}`,
      },
      {
        content: "Hello! I'm your AI assistant. How can I help you today?",
        role: ASSISTANT,
      },
    ];

    setchatId(undefined);
    setSelectedChat(undefined);
  };

  const onSelectChat = (chat) => {
    setSelectedChat(chat);
    setchatId(chat.id);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      className={`bg-gray-900 text-white flex flex-col transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4">
        {!isCollapsed && <h1 className="text-lg font-semibold">Chats</h1>}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRightIcon size={20} />
          ) : (
            <ChevronLeftIcon size={20} />
          )}
        </button>
      </div>

      {/* New Chat Button */}
      {!isCollapsed && (
        <button
          onClick={handleNewChat}
          className="flex items-center justify-center bg-gray-700 hover:bg-gray-600 p-2 rounded-md mb-4 transition-colors"
        >
          <PlusIcon className="mr-2" size={20} />
          New Chat
        </button>
      )}

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto">
          {chats?.map((chat, index) => {
            return (
              <div
                key={index}
                onClick={() => onSelectChat(chat, index)}
                className={`flex items-center p-2 rounded-md cursor-pointer mb-2 ${
                  selectedChat?.id === chat.id && !isCollapsed
                    ? "bg-gray-700"
                    : "hover:bg-gray-800"
                }`}
              >
                <MessageSquareIcon
                  className={`mr-2 ${isCollapsed ? "hidden" : ""}`}
                  size={20}
                />
                {!isCollapsed && <span className="truncate">{chat.title}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
