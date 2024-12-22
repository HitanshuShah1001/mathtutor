import React, { useState, useEffect, useRef } from "react";
import { MathJaxContext } from "better-react-mathjax";
import OpenAI from "openai";
import { ChatHeader } from "../subcomponents/ChatHeader";
import { ChatMessage } from "../subcomponents/Chatmessage";
import { ShowLoading } from "../subcomponents/ShowLoading";
import { ScrollToBottom } from "../subcomponents/ScrollToBottom";
import { ChatInput } from "../subcomponents/ChatInput";

const openai = new OpenAI({
  apiKey: `sk-proj-REPLACE_WITH_YOUR_REAL_KEY`,
  dangerouslyAllowBrowser: true, // For demos only, not production-safe!
});

export function ResultAnalyser() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // If you want to detect whether user is scrolled up, you can manage that here.
  const [isScrolledUp, setIsScrolledUp] = useState(false);

  const chatContainerRef = useRef(null);
  const chatEndRef = useRef(null);

  async function createThread() {
    try {
      const thread = await openai.beta.threads.create();
      localStorage.setItem("thread_id", thread.id);
      return thread.id;
    } catch (error) {
      console.error("Error creating thread:", error);
      return null;
    }
  }

  async function createThreadAndMessage({ content }) {
    try {
      let threadId = localStorage.getItem("thread_id");
      if (!threadId) {
        threadId = await createThread();
      }

      // Create a new user message in the thread
      const message = await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content,
      });

      // Add user’s message to local state so we can see it immediately
      setMessages((prev) => [
        ...prev,
        {
          id: message.id,
          role: "user",
          content: message.content,
          mediaUrl: null,
        },
      ]);

      // After sending the user message, get the AI’s response
      await getResults(threadId);
    } catch (err) {
      console.error("Error creating thread or message:", err);
    }
  }

  async function getResults(threadId) {
    try {
      setIsLoading(true);

      // Create a run and poll until completion
      const run = await openai.beta.threads.runs.createAndPoll(threadId, {
        // Provide your correct assistant_id
        assistant_id: "asst_2bwaorGljw9JSlanqjfI1ylN",
      });

      if (run.status === "completed") {
        // Once complete, list all messages
        const { data } = await openai.beta.threads.messages.list(run.thread_id);
        // Reverse them if you want latest at the bottom
        const reversedMessages = data.reverse() || [];

        // Map them into your local state shape
        const mapped = reversedMessages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          mediaUrl: null, // or msg.mediaUrl if that exists in your data
        }));

        setMessages(mapped);
      } else {
        console.warn("Run status is not completed:", run.status);
      }
    } catch (error) {
      console.error("Error in getResults:", error);
    } finally {
      setIsLoading(false);
      // Scroll to the bottom once new messages are loaded
      scrollToBottom();
    }
  }

  async function handleSendMessage() {
    if (!inputMessage.trim()) return;

    setIsLoading(true);

    await createThreadAndMessage({ content: inputMessage.trim() });
    setInputMessage("");
    scrollToBottom();
  }

  useEffect(() => {
    const existingThreadId = localStorage.getItem("thread_id");
    if (existingThreadId) {
      console.log("[Chat] Found existing thread:", existingThreadId);
      // Optionally, fetch messages from that thread on page load
      getResults(existingThreadId);
    }
  }, []);

  function scrollToBottom() {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <MathJaxContext>
      <div className="flex flex-col h-full">
        <ChatHeader />

        {/* Chat message container */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto bg-white relative"
        >
          {/* Render messages */}
          {messages?.map((message) => (
            <ChatMessage
              key={message.id}
              message={message.content}
              role={message.role}
              mediaUrl={message.mediaUrl ?? null}
            />
          ))}

          {/* Show loading indicator if needed */}
          {isLoading && <ShowLoading />}

          {/* Div to anchor scrolling to the bottom */}
          <div ref={chatEndRef} />

          {/* Button or icon to auto-scroll down if user is scrolled up */}
          <ScrollToBottom
            isScrolledUp={isScrolledUp}
            scrollToBottom={scrollToBottom}
          />
        </div>

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
