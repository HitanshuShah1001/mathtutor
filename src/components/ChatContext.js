import { createContext, useState, useEffect } from "react";
import { ASSISTANT, BASE_URL_API } from "../constants/constants";
import { getRequest } from "../utils/ApiCall";

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

  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(chats[0]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const getInitialChats = async () => {
      const access = localStorage.getItem("accessKey");
      const headers = {
        Authorization: access,
      };
      const params = {
        userId: 3,
        messages: 10,
        limit: 10,
      };
      const result = await getRequest(
        `${BASE_URL_API}/chat/getPaginatedChats`,
        headers,
        params
      );
      setChats(result.chats)
    };

    getInitialChats();
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
