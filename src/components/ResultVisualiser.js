import React, { useState, useEffect, useRef } from "react";
import { MathJaxContext } from "better-react-mathjax";
import OpenAI from "openai";
import { ChatHeader } from "../subcomponents/ChatHeader";
import { ChatMessage } from "../subcomponents/Chatmessage";
import { ShowLoading } from "../subcomponents/ShowLoading";
import { ScrollToBottom } from "../subcomponents/ScrollToBottom";
import { ChatInput } from "../subcomponents/ChatInput";

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

    // Scroll to bottom when messages change
    scrollToBottom();

    return () => {
      chatContainer?.removeEventListener("scroll", handleScroll);
    };
  }, [messages]);

  async function createThread() {
    try {
      const thread = await openai.beta.threads.create();
      localStorage.setItem("thread_id", thread.id);
      console.log("[createThread] Created thread with ID:", thread.id);
      return thread.id;
    } catch (error) {
      console.error("Error creating thread:", error);
      return null;
    }
  }

 

  async function createMessage(threadId, content) {
    try {
      const message = await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: message.id,
          role: "user",
          content,
          mediaUrl: null,
        },
      ]);

      // After sending the user message, fetch the AI response
      await getResults(threadId);
    } catch (err) {
      console.error("Error creating message:", err);
    }
  }

  /**
   * 3. Retrieve the assistant’s response from the thread.
   */
  async function getResults(threadId) {
    try {
      setIsLoading(true);

      // Create a run and poll until completion
      const run = await openai.beta.threads.runs.createAndPoll(threadId, {
        // Provide your correct assistant_id if needed
        assistant_id: "asst_2bwaorGljw9JSlanqjfI1ylN",
      });

      if (run.status === "completed") {
        // Once complete, list all messages in the thread
        const { data } = await openai.beta.threads.messages.list(run.thread_id);
        // Reverse them if you want the latest at the bottom
        const reversedMessages = data.reverse() || [];

        // Map them to your local state shape
        const mapped = reversedMessages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          mediaUrl: null,
        }));

        setMessages(mapped);
      } else {
        console.warn("[getResults] Run status is not completed:", run.status);
      }
    } catch (error) {
      console.error("Error in getResults:", error);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  }

  async function handleSendMessage() {
    if (!inputMessage.trim()) return;

    setIsLoading(true);

    // 4a. Check if thread exists
    let threadId = localStorage.getItem("thread_id");

    // 4b. If no thread, create it
    if (!threadId) {
      threadId = await createThread();
      if (!threadId) {
        // If creation failed, stop here
        setIsLoading(false);
        return;
      }
    }

    // 4c. Create the user message in that thread
    await createMessage(threadId, inputMessage.trim());

    setInputMessage("");
    scrollToBottom();
  }

  // On mount, check for existing thread, optionally load the conversation
  useEffect(() => {
    const existingThreadId = localStorage.getItem("thread_id");
    if (existingThreadId) {
      console.log("[ResultAnalyser] Found existing thread:", existingThreadId);
      // Optionally load existing messages right away:
      // getResults(existingThreadId);
    }
  }, []);

  return (
    <MathJaxContext>
      <div className="flex flex-col h-full">
        <ChatHeader />


        {/* <div
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
        </div> */}

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
