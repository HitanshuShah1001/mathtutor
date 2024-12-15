import React, { useState, useRef, useEffect, useContext } from "react";
import { MathJaxContext } from "better-react-mathjax";
import { ChatMessage } from "../subcomponents/Chatmessage.js";
import {
  ACCESS_KEY,
  ASSISTANT,
  BASE_URL_API,
  USER,
} from "../constants/constants.js";
import { openai } from "./InitOpenAI.js";
import { ChatHeader } from "../subcomponents/ChatHeader.js";
import { ChatInput } from "../subcomponents/ChatInput.js";
import { ScrollToBottom } from "../subcomponents/ScrollToBottom.js";
import { ShowLoading } from "../subcomponents/ShowLoading.js";
import AWS from "aws-sdk/global"; // Import global AWS namespace (recommended)
import S3 from "aws-sdk/clients/s3";
import { postRequest } from "../utils/ApiCall.js";
import { AuthContext } from "../utils/AuthContext.js";

const ChatContainer = () => {
  const { selectedChat, setchatId, chatId, setChats, chats } =
    useContext(AuthContext);
  const [messages, setMessages] = useState(
    [...(selectedChat?.messagePayload?.messages ?? [...[]])].reverse() ?? []
  );
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const access = localStorage.getItem(ACCESS_KEY);
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsScrolledUp(false);
  };

  useEffect(() => {
    if (selectedChat) {
      setMessages(
        [...(selectedChat?.messagePayload?.messages ?? [...[]])].reverse() ?? []
      );
    } else {
      setMessages([]);
    }
  }, [selectedChat]);

  useEffect(() => {
    const chatContainer = chatContainerRef.current;

    const handleScroll = () => {
      if (chatContainer) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainer;
        setIsScrolledUp(scrollHeight - scrollTop - clientHeight > 100);
      }
    };

    chatContainer?.addEventListener("scroll", handleScroll);

    // Scroll to bottom when messages change
    scrollToBottom();

    return () => {
      chatContainer?.removeEventListener("scroll", handleScroll);
    };
  }, [messages]);

  const uploadImageToS3 = async (file) => {
    const S3_BUCKET = process.env.REACT_APP_S3_BUCKET_NAME;
    const REGION = process.env.REACT_APP_AWS_REGION;
    AWS.config.update({
      accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
      region: REGION,
    });

    const s3 = new S3({
      region: REGION,
    });
    const params = {
      Bucket: S3_BUCKET,
      Key: file.name,
      Body: file,
    };

    try {
      await s3.putObject(params).promise();

      return `https://tutor-staffroom-files.s3.ap-south-1.amazonaws.com/${file.name}`;
      //https://tutor-staffroom-files.s3.ap-south-1.amazonaws.com/63145382.jpeg
    } catch (error) {
      console.error(error);
      alert("Error uploading file: " + error.message); // Inform user about the error
    }
  };

  const handleSendMessage = async ({ inputMessage, image = undefined }) => {
    if (!inputMessage.trim()) return;
    let userContentForAi;
    let newUserMessage = {};

    if (image) {
      const ImageUrl = await uploadImageToS3(image);
      userContentForAi = [
        { type: "text", text: inputMessage },
        { type: "image_url", image_url: { url: ImageUrl } },
      ];
      newUserMessage["mediaUrl"] = ImageUrl;
      newUserMessage["content"] = inputMessage;
    } else {
      userContentForAi = inputMessage;
      newUserMessage["content"] = inputMessage;
    }

    // Prepare the full message history for context
    const conversationHistory = messages?.map((msg) => {
      const content = msg.mediaUrl
        ? [
            { type: "text", text: msg.content },
            { type: "image_url", image_url: { url: msg.mediaUrl } },
          ]
        : msg.content; // If no mediaUrl, just include the text
      return {
        role: msg.role === USER ? USER : ASSISTANT,
        content: content,
      };
    });

    // Add current user message
    conversationHistory.push({
      role: "user",
      content: userContentForAi,
    });

    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputMessage("");
    setIsLoading(true);
    try {
      let id;
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // You can change this to gpt-4 if preferred
        messages: conversationHistory,
      });
      const aiResponse = response.choices[0].message.content.trim();
      const newAIMessage = {
        content: aiResponse,
        role: ASSISTANT,
      };

      if (conversationHistory.length === 1) {
        const createChat = await postRequest(
          `${BASE_URL_API}/chat/create`,
          { Authorization: access },
          { title: `${new Date(Date.now())}`, userId: 3 }
        );
        id = createChat.chat.id;
        setchatId(id);
        let messageToSendToApiForCreation = [];
        for (let message of [
          ...messages.splice(1),
          newUserMessage,
          newAIMessage,
        ]) {
          message["chatId"] = id;
          message["role"] = message.role.toUpperCase();
          messageToSendToApiForCreation.push(message);
        }
        await postRequest(
          `${BASE_URL_API}/messages/create`,
          { Authorization: access },
          { messages: messageToSendToApiForCreation }
        );
        setMessages((prevMessages) => [...prevMessages, newAIMessage]);
      } else {
        let messageToSendToApiForCreation = [];
        for (let message of [newUserMessage, newAIMessage]) {
          message["chatId"] = chatId;
          message["role"] = message.role.toUpperCase();
          messageToSendToApiForCreation.push(message);
        }
        await postRequest(
          `${BASE_URL_API}/messages/create`,
          { Authorization: access },
          { messages: messageToSendToApiForCreation }
        );
        setMessages((prevMessages) => [...prevMessages, newAIMessage]);
        const chatwithId = chats.find((chat) => chat.id === chatId);
        console.log(chatwithId, "chat with id");
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messagePayload: {
                    ...chat.messagePayload,
                    messages: [
                      newUserMessage,
                      newAIMessage,
                      ...messages.reverse(),
                    ],
                  },
                }
              : chat
          )
        );
      }
    } catch (error) {
      console.error("Error generating response:", error);

      // Optional: Add error message to chat
      const errorMessage = {
        content: "Sorry, there was an error processing your request.",
        role: ASSISTANT,
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <MathJaxContext>
      <div className="flex flex-col h-full">
        <ChatHeader />
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto bg-white relative"
        >
          {messages?.map((message) => (
            <ChatMessage
              key={message.id}
              message={message.content}
              role={message.role}
              mediaUrl={message.mediaUrl ?? null}
            />
          ))}

          {isLoading && <ShowLoading />}
          <div ref={chatEndRef} />
          <ScrollToBottom
            isScrolledUp={isScrolledUp}
            scrollToBottom={scrollToBottom}
          />
        </div>
        <ChatInput
          isLoading={isLoading}
          handleSendMessage={handleSendMessage}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
        />
      </div>
    </MathJaxContext>
  );
};

export default ChatContainer;
