import { createContext, useState, useEffect } from "react";
import { ASSISTANT, BASE_URL_API } from "../constants/constants";
import { getRequest } from "../utils/ApiCall";

export const ChatContext = createContext(null);

export const ChatContextProvider = ({ children }) => {


  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(undefined);
  const [chatId, setchatId] = useState(undefined);

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
  }, []);

  return (
    <ChatContext.Provider
      value={{
        chats,
        setChats,
        selectedChat,
        setSelectedChat,
        chatId,
        setchatId,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
