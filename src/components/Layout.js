import React, { useState } from 'react';
import ChatContainer from './ChatContainer';
import Sidebar from './Sidebar';

const Layout = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([
    { id: 1, title: 'AI Assistance', messages: [] },
    { id: 2, title: 'Project Discussion', messages: [] },
    { id: 3, title: 'Code Help', messages: [] }
  ]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar 
        chats={chats} 
        selectedChat={selectedChat}
        onSelectChat={setSelectedChat}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1">
        <ChatContainer 
          selectedChat={selectedChat}
          chats={chats}
          setChats={setChats}
        />
      </div>
    </div>
  );
};

export default Layout;