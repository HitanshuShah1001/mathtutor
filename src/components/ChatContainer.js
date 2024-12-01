import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, UserIcon, ActivityIcon } from 'lucide-react';
import ProfileMenu from './ProfileMenu';

// Mock AI response function (replace with actual AI API call)
const generateAIResponse = async (message) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const responses = [
    "That's an interesting point! Could you tell me more?",
    "I'm here to help. What would you like to discuss?",
    "Fascinating! I can provide more information about that.",
    "Great question! Let me break that down for you.",
    "I'm always eager to learn and help."
  ];

  return responses[Math.floor(Math.random() * responses.length)];
};

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

    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const aiResponse = await generateAIResponse(inputMessage);
      
      const newAIMessage = {
        id: messages.length + 1,
        text: aiResponse,
        type: 'ai'
      };

      setMessages(prevMessages => [...prevMessages, newAIMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
        {messages.map((message) => (
          <ChatMessage 
            key={message.id}
            message={message.text}
            type={message.type}
          />
        ))}
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
  );
};

export default ChatContainer;