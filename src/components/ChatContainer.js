import React, { useState, useRef, useEffect, useContext } from "react";
import { MathJaxContext } from "better-react-mathjax";
import { ChatMessage } from "./Chatmessage";
import { ASSISTANT, USER } from "../constants/constants.js";
import { openai } from "./InitOpenAI.js";
import { ChatHeader } from "./ChatHeader.js";
import { ChatInput } from "./ChatInput.js";
import { ScrollToBottom } from "./ScrollToBottom.js";
import { ShowLoading } from "./ShowLoading.js";
import AWS from "aws-sdk/global"; // Import global AWS namespace (recommended)
import S3 from "aws-sdk/clients/s3";
import { ChatContext } from "./ChatContext.js";

const ChatContainer = () => {
  const { selectedChat, setSelectedChat, chats, selectedIndex, setChats } =
    useContext(ChatContext);

  const [messages, setMessages] = useState(selectedChat?.slice(1));
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);

  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (selectedChat) {
      setMessages(selectedChat.slice(1));
    }
  }, [selectedChat]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsScrolledUp(false);
  };

  useEffect(() => {
    //console.log(chats, "cahts");
  }, [chats]);

  useEffect(() => {
    const chatContainer = chatContainerRef.current;

    const handleScroll = () => {
      if (chatContainer) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainer;
        // Check if scrolled up from the bottom
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
    let newChats;
    if (!inputMessage.trim()) return;
    let userContent;

    if (image) {
      const ImageUrl = await uploadImageToS3(image);
      userContent = [
        { type: "text", text: inputMessage },
        { type: "image_url", image_url: { url: ImageUrl } },
      ];
    } else {
      userContent = inputMessage;
    }
    const newUserMessage = {
      id: messages.length,
      content: userContent,
      type: USER,
    };

    // Prepare the full message history for context
    const conversationHistory = messages.map((msg) => ({
      role: msg.type === USER ? USER : ASSISTANT,
      content: msg.content,
    }));

    // Add current user message
    conversationHistory.push({
      role: "user",
      content: userContent,
    });

    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setSelectedChat((prevChat) => [...prevChat, newUserMessage]);
    newChats = [...chats];
    newChats[selectedIndex] = [...chats[selectedIndex], newUserMessage];
    localStorage.setItem("chats", JSON.stringify(newChats));
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // You can change this to gpt-4 if preferred
        messages: conversationHistory,
      });
      const aiResponse = response.choices[0].message.content.trim();
      const newAIMessage = {
        id: messages.length + 1,
        content: aiResponse,
        type: ASSISTANT,
      };

      setMessages((prevMessages) => [...prevMessages, newAIMessage]);
      setSelectedChat((prevChat) => [...prevChat, newAIMessage]);
      newChats[selectedIndex] = [...newChats[selectedIndex], newAIMessage];
      localStorage.setItem("chats",JSON.stringify(newChats))
      setChats(newChats);
    } catch (error) {
      console.error("Error generating response:", error);

      // Optional: Add error message to chat
      const errorMessage = {
        id: messages.length + 1,
        content: "Sorry, there was an error processing your request.",
        type: ASSISTANT,
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
      setSelectedChat((prevchat) => [...prevchat, errorMessage]);
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
              type={message.type}
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
