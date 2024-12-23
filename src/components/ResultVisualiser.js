import React, { useState, useEffect, useRef } from "react";
import { MathJaxContext } from "better-react-mathjax";
import OpenAI from "openai";
import { ChatHeader } from "../subcomponents/ChatHeader";
import { ChatMessage } from "../subcomponents/Chatmessage";
import { ShowLoading } from "../subcomponents/ShowLoading";
import { ScrollToBottom } from "../subcomponents/ScrollToBottom";
import { ChatInput } from "../subcomponents/ChatInput";
import {
  ASSISTANT,
  ASSISTANT_ID,
  MESSAGE_STATUS,
  THREAD_ID,
  USER,
} from "../constants/constants";

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // For demos only, not production-safe!
});

export function ResultAnalyser() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  async function createThread() {
    try {
      const thread = await openai.beta.threads.create();
      sessionStorage.setItem(THREAD_ID, thread.id);
      return thread.id;
    } catch (error) {
      console.error(MESSAGE_STATUS.ERROR_CREATE_THREAD, error);
      return null;
    }
  }

  async function createMessage(threadId, content) {
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

  async function getResults(threadId) {
    try {
      setIsLoading(true);
      
      const run = await openai.beta.threads.runs.createAndPoll(threadId, {
        assistant_id: ASSISTANT_ID,
      });

      if (run.status === "completed") {
        const messages = await openai.beta.threads.messages.list(run.thread_id);
        for (const message of messages.data.reverse()) {
          setMessages((prev) => [
            ...prev,
            {
              id: message.id,
              role: ASSISTANT,
              content: message.content[0].text.value,
            },
          ]);
          console.log(`${message.role} > ${message.content[0].text.value}`);
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

    let threadId = sessionStorage.getItem(THREAD_ID);

    if (!threadId) {
      threadId = await createThread();
      if (!threadId) {
        return;
      }
    }

    await createMessage(threadId, inputMessage.trim());

    setInputMessage("");
  }

  useEffect(() => {
    const existingThreadId = sessionStorage.getItem(THREAD_ID);
    if (existingThreadId) {
      console.log("found existing thread");
    }
  }, []);

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
