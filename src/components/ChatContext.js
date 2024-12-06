import { createContext, useState } from "react";
import { ASSISTANT } from "../constants/constants";

export const ChatContext = createContext(null);

export const ChatContextProvider = ({ children }) => {
  const [chats, setChats] = useState([
    [
      {
        id: new Date(Date.now()),
        title: "New Chat",
      },
      {
        id: 0,
        content: "Hello! I'm your AI assistant. How can I help you today?",
        type: ASSISTANT,
      },
    ],
  ]);
  const [selectedChat, setSelectedChat] = useState(chats[0]);
  const [selectedIndex, setSelectedIndex] = useState(0);
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
