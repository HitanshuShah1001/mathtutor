import React, { useState, useEffect } from "react";
import OpenAI from "openai"; // If you have the 'openai' library installed.
import {
  chatBodyStyle,
  containerStyle,
  footerStyle,
  headerStyle,
  inputStyle,
  messageStyle,
  sendButtonStyle,
} from "./ResultVisualiser/styles";

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Only for client-side demos. Use backend in production!
});

export function ResultAnalyser() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");

  // 1. Create a new thread, store in localStorage.
  async function createThread() {
    try {
      const thread = await openai.beta.threads.create();
      localStorage.setItem("thread_id", thread.id);
      console.log("[createThread] Created thread with ID:", thread.id);
      return thread.id;
    } catch (err) {
      console.error("[createThread] Error creating thread:", err);
    }
  }

  // 2. Create thread (if needed) and send a new user message.
  async function createThreadAndMessage({ content }) {
    let threadId = localStorage.getItem("thread_id");

    // If thread doesn’t exist in storage, create a new one
    if (!threadId) {
      threadId = await createThread();
    }
    if (!threadId) {
      console.error("[createThreadAndMessage] No thread ID found/created.");
      return;
    }

    try {
      // Create a user message within this thread
      const message = await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content,
      });

      // Update local state with the user’s message
      setMessages((prev) => [
        ...prev,
        { role: "user", content: message.content },
      ]);

      // After sending the message, call getResults to get the assistant’s response
      await getResults(threadId);
    } catch (err) {
      console.error("[createThreadAndMessage] Error creating message:", err);
    }
  }

  // 3. Retrieve the assistant’s response from the thread.
  async function getResults(threadId) {
    try {
      // Create and poll the thread run
      const run = await openai.beta.threads.runs.createAndPoll(threadId, {
        // Replace with your own assistant ID if needed
        assistant_id: "asst_2bwaorGljw9JSlanqjfI1ylN",
      });

      // Once the run is completed, fetch the list of messages
      if (run.status === "completed") {
        const { data } = await openai.beta.threads.messages.list(run.thread_id);
        // The API returns messages in ascending order, so reverse if needed
        const reversedMessages = data.reverse();
        // Update local state with the entire conversation
        setMessages(reversedMessages);
      } else {
        console.log("[getResults] Run status:", run.status);
      }
    } catch (err) {
      console.error("[getResults] Error getting results:", err);
    }
  }

  // On mount, check for an existing thread
  useEffect(() => {
    const storedThreadId = localStorage.getItem("thread_id");
    if (storedThreadId) {
      console.log("[ChatComponent] Found existing thread_id:", storedThreadId);
      // Optionally, you might fetch existing messages here, if desired:
      // getResults(storedThreadId);
    } else {
      console.log("[ChatComponent] No existing thread in local storage.");
    }
  }, []);

  // Handle user clicking "Send"
  const handleSend = async () => {
    if (!inputText.trim()) return;
    await createThreadAndMessage({ content: inputText.trim() });
    setInputText("");
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>My Chatbot</div>
      <div style={chatBodyStyle}>
        {messages.map((msg, idx) => (
          <div key={idx} style={messageStyle(msg.role)}>
            {msg.content}
          </div>
        ))}
      </div>
      <div style={footerStyle}>
        <input
          type="text"
          style={inputStyle}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your message..."
        />
        <button style={sendButtonStyle} onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
}
