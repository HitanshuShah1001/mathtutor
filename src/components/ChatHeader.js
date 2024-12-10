import { useContext } from "react";
import ProfileMenu from "./ProfileMenu";
import { AuthContext } from "../utils/AuthContext";

export const ChatHeader = () => {
  const {selectedChat} = useContext(AuthContext);
    return (
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">
          {selectedChat ? selectedChat.title : 'New chat'}
        </h2>
        <ProfileMenu />
      </div>
    );
  };