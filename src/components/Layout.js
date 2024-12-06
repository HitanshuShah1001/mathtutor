import React, { useContext, useState } from "react";
import ChatContainer from "./ChatContainer";
import Sidebar from "./Sidebar";
import { ChatContext } from "./ChatContext";

const Layout = () => {
  const { chats, setChats, selectedChat } =
    useContext(ChatContext);
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1">
        <ChatContainer
          selectedChat={selectedChat}
          chats={chats}
          setChats={setChats}
        />
      </div>
    </div>
  );
};

export default Layout;
