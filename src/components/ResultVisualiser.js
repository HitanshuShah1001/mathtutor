import React, { useState, useEffect, useRef } from "react";
import { MathJaxContext } from "better-react-mathjax";
import OpenAI from "openai";
import { ChatHeader } from "../subcomponents/ChatHeader";
import { ChatMessage } from "../subcomponents/Chatmessage";
import { ShowLoading } from "../subcomponents/ShowLoading";
import { ScrollToBottom } from "../subcomponents/ScrollToBottom";
import { ChatInput } from "../subcomponents/ChatInput";
import { ASSISTANT, MESSAGE_STATUS, USER } from "../constants/constants";
import { useLocation } from "react-router-dom";

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export function ResultAnalyser() {
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const threadId = location.state?.thread_id;
  const assistant_id = location.state?.assistant_id;
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const chatContainerRef = useRef(null);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsScrolledUp(false);
  };

  useEffect(() => {
    const chatContainer = chatContainerRef.current;

    const handleScroll = () => {
      if (chatContainer) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainer;
        setIsScrolledUp(scrollHeight - scrollTop - clientHeight > 100);
      }
    };

    chatContainer?.addEventListener("scroll", handleScroll);

    scrollToBottom();

    return () => {
      chatContainer?.removeEventListener("scroll", handleScroll);
    };
  }, [messages]);

  async function createMessage(content) {
    try {
      const message = await openai.beta.threads.messages.create(threadId, {
        role: USER,
        content,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: message.id,
          role: USER,
          content,
        },
      ]);
      await getResults(threadId);
    } catch (err) {
      console.error(MESSAGE_STATUS.ERROR_CREATE_MESSAGE, err);
    }
  }

  async function getResults() {
    try {
      setIsLoading(true);
      const run = await openai.beta.threads.runs.createAndPoll(threadId, {
        assistant_id: assistant_id,
      });
      if (run.status === "completed") {
        setMessages([]);
        const messages = await openai.beta.threads.messages.list(run.thread_id);
        for (const message of messages.data.reverse()) {
          for (let individualMessage of message.content) {
            if (individualMessage.type === "text") {
              setMessages((prev) => [
                ...prev,
                {
                  id: message.id,
                  role: ASSISTANT,
                  content: individualMessage.text.value,
                },
              ]);
            }
          }
        }
        scrollToBottom();
      }
    } catch (error) {
      console.error(MESSAGE_STATUS.ERROR_GET_RESULTS, error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendMessage() {
    if (!inputMessage.trim()) return;
    await createMessage(inputMessage.trim());
    setInputMessage("");
    scrollToBottom();
  }

  return (
    <MathJaxContext>
      <div className="flex flex-col h-screen">
        <ChatHeader />
        
        {/* Messages container with fixed height and scrollable content */}
        <div className="flex-1 relative">
          <div 
            ref={chatContainerRef}
            className="absolute inset-0 overflow-y-auto bg-white"
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

            {isScrolledUp && (
              <button
                onClick={scrollToBottom}
                className="fixed bottom-24 right-4 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-colors"
              >
                <svg 
                  className="w-6 h-6" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Chat input with fixed position at bottom */}
        <div className="bg-white">
          <ChatInput
            isLoading={isLoading}
            handleSendMessage={handleSendMessage}
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
          />
        </div>
      </div>
    </MathJaxContext>
  );
}