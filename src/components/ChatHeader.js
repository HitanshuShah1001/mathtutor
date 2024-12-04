import ProfileMenu from "./ProfileMenu";

export const ChatHeader = ({ selectedChat }) => {
    return (
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">
          {selectedChat
            ? chats.find((chat) => chat.id === selectedChat)?.title
            : "New Chat"}
        </h2>
        <ProfileMenu />
      </div>
    );
  };