import React, { useContext } from "react";
import { PlusIcon, MessageSquareIcon, TrashIcon } from "lucide-react";
import { ChatContext } from "./ChatContext";
import { ASSISTANT } from "../constants/constants";

const Sidebar = () => {
  const { chats, setChats, selectedChat, setSelectedChat, setSelectedIndex } =
    useContext(ChatContext);

  const handleNewChat = () => {
    const newChat = [
      {
        id: new Date().toISOString(), // Use ISO string for consistent format
        title: `New Chat ${chats.length + 1}`,
      },
      {
        id: 0,
        content: "Hello! I'm your AI assistant. How can I help you today?",
        type: ASSISTANT,
      },
    ];

    // Add the new chat and set it as selected
    setChats((prevChats) => {
      const updatedChats = [...prevChats, newChat];
      localStorage.setItem("chats", JSON.stringify(updatedChats)); // Persist to localStorage
      return updatedChats;
    });

    setSelectedIndex(chats.length);
    setSelectedChat(newChat);
  };

  const onSelectChat = (chat, index) => {
    setSelectedChat(chat);
    setSelectedIndex(index);
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
        {chats.map((chat, index) => (
          <div
            key={index}
            onClick={() => onSelectChat(chat, index)}
            className={`
              flex items-center p-2 rounded-md cursor-pointer mb-2 
              ${
                selectedChat === chat
                  ? "bg-gray-700"
                  : "hover:bg-gray-800"
              }
            `}
          >
            <MessageSquareIcon className="mr-2" size={20} />
            <span className="truncate">{chat[0]?.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
