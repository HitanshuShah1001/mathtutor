import React, { useContext } from "react";
import ChatContainer from "./ChatContainer";
import Sidebar from "./Sidebar";
import { AuthContext } from "../utils/AuthContext";

const Layout = () => {
  const { chats, setChats, selectedChat } =
    useContext(AuthContext);
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
