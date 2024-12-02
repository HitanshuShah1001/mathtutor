import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, UserIcon, ActivityIcon } from 'lucide-react';
import ProfileMenu from './ProfileMenu';
import OpenAI from 'openai';
import { MathJax, MathJaxContext } from 'better-react-mathjax'; // Import MathJax from better-react-mathjax

// ChatMessage component
const ChatMessage = ({ message, type }) => {
  return (
    <div className={`flex p-4 ${type === 'user' ? 'bg-gray-50' : 'bg-white'}`}>
      <div className={`w-10 h-10 mr-4 rounded-full flex items-center justify-center 
        ${type === 'user' ? 'bg-blue-500' : 'bg-green-500'}`}>
        {type === 'user' ? <UserIcon className="text-white" size={20} /> : <ActivityIcon className="text-white" size={20} />}
      </div>
      <div className="flex-1">
        <p className={`${type === 'user' ? 'text-blue-800' : 'text-green-800'}`}>
          {message}
        </p>
      </div>
    </div>
  );
};

const ChatContainer = ({ selectedChat, chats, setChats }) => {
  const [messages, setMessages] = useState([
    { 
      id: 0, 
      text: "Hello! I'm your AI assistant. How can I help you today?", 
      type: 'ai' 
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Initialize OpenAI client (replace with your actual API key)
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    dangerouslyAllowBrowser: true // Note: Only for client-side demos. Use backend in production.
  });

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newUserMessage = {
      id: messages.length,
      text: inputMessage,
      type: 'user'
    };

    // Prepare the full message history for context
    const conversationHistory = messages.map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    // Add current user message
    conversationHistory.push({
      role: 'user',
      content: inputMessage
    });

    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // You can change this to gpt-4 if preferred
        messages: conversationHistory,
      });
      console.log(response,"response received")
      const aiResponse = response.choices[0].message.content.trim();
      
      const newAIMessage = {
        id: messages.length + 1,
        text: aiResponse,
        type: 'ai'
      };

      setMessages(prevMessages => [...prevMessages, newAIMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      
      // Optional: Add error message to chat
      const errorMessage = {
        id: messages.length + 1,
        text: "Sorry, there was an error processing your request.",
        type: 'ai'
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to check if the message contains LaTeX
  const containsLatex = (text) => {
    // Detect inline and block LaTeX using regex
    const inlineMathRegex = /\\\(.*?\\\)/g;
    const blockMathRegex = /\\\[.*?\\\]/gs;

    return inlineMathRegex.test(text) || blockMathRegex.test(text);
  };

  return (
    <MathJaxContext>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {selectedChat 
              ? chats.find(chat => chat.id === selectedChat)?.title 
              : 'New Chat'}
          </h2>
          <ProfileMenu />
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto bg-white">
          {messages.map((message) => {
            return (
              <ChatMessage 
                key={message.id}
                message={
                  containsLatex(message.text)
                    ? <MathJax>{message.text}</MathJax> // If contains LaTeX, render with MathJax
                    : message.text
                }
                type={message.type}
              />
            );
          })}
          {isLoading && (
            <div className="flex p-4 bg-white">
              <div className="w-10 h-10 mr-4 rounded-full bg-green-500 flex items-center justify-center">
                <ActivityIcon className="text-white" size={20} />
              </div>
              <div className="flex-1">
                <p className="text-gray-500 animate-pulse">Typing...</p>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white p-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Send a message"
              className="flex-1 p-2 border rounded-lg resize-none max-h-24 overflow-y-auto"
              rows={1}
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className={`p-2 rounded-full 
                ${inputMessage.trim() && !isLoading 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
              <SendIcon size={20} />
            </button>
          </div>
        </div>
      </div>
    </MathJaxContext>
  );
};

export default ChatContainer;
