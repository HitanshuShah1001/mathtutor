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
  dangerouslyAllowBrowser: true, // For demos only, not production-safe!
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
      console.log(message, "message creatd -- step 1");
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
      console.log("In get results", "step 2");
      const run = await openai.beta.threads.runs.createAndPoll(threadId, {
        assistant_id: assistant_id,
      });
      console.log(run, "run -- step 3");
      if (run.status === "completed") {
        setMessages([]);
        console.log("In get results", "step 4", run);
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
  }

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

        {/* Fixed input at the bottom */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0 }}>
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
