import { createContext, useState, useEffect } from "react";
import { ASSISTANT } from "../constants/constants";

export const ChatContext = createContext(null);

export const ChatContextProvider = ({ children }) => {
  const defaultChats = [
    [
      {
        id: new Date(Date.now()),
        title: "New Chat",
      },
      {
        index: 0,
        content: "Hello! I'm your AI assistant. How can I help you today?",
        type: ASSISTANT,
      },
    ],
  ];

  // Retrieve chats from local storage or use default
  const getInitialChats = () => {
    const storedChats = localStorage.getItem("chats");
    console.log(storedChats,"stored chats")
    return storedChats ? JSON.parse(storedChats) : defaultChats;
  };

  const [chats, setChats] = useState(getInitialChats);
  const [selectedChat, setSelectedChat] = useState(chats[0]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Persist chats to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem("chats", JSON.stringify(chats));
  }, [chats]);

  return (
    <ChatContext.Provider
      value={{
        chats,
        setChats,
        selectedChat,
        setSelectedChat,
        selectedIndex,
        setSelectedIndex,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
