/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect } from "react";
import ChatContainer from "./ChatContainer";
import Sidebar from "./Sidebar";
import { AuthContext } from "../utils/AuthContext";
import { getInitialChats } from "./ChatContext";

export const Layout = () => {
  const { chats, setChats, selectedChat } = useContext(AuthContext);

  useEffect(() => {
    async function fetchData() {
      const chats = await getInitialChats();
      setChats(chats);
    }

    fetchData();
  }, []);
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />  
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
