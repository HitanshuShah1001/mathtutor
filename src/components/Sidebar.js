import React, { useContext, useEffect } from "react";
import { PlusIcon, MessageSquareIcon } from "lucide-react";
import { ChatContext } from "./ChatContext";
import { ASSISTANT } from "../constants/constants";

const Sidebar = () => {
  const {
    chats,
    setChats,
    selectedChat,
    setSelectedChat,
    selectedIndex,
    setSelectedIndex,
  } = useContext(ChatContext);
  useEffect(() => {
    const storedChats = JSON.parse(localStorage.getItem("chats"));
    // if (storedChats) {
    //   setChats(storedChats);
    // }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewChat = () => {
    let newChat = [
      {
        id: new Date(Date.now()),
        title: ` New chat ${chats.length + 1}`,
      },
      {
        id: 0,
        content: "Hello! I'm your AI assistan. How can I help you today?",
        type: ASSISTANT,
      },
    ];
    setSelectedIndex(chats.length);
    setChats((prevchats) => [...prevchats, newChat]);
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
              ${selectedChat === chat.id ? "bg-gray-700" : "hover:bg-gray-800"}
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
