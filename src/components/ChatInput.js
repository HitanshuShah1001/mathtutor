import { SendIcon } from "lucide-react";

export const ChatInput = ({handleSendMessage,inputMessage,isLoading,setInputMessage}) => {
  return (
    <div className="bg-white p-4 border-t border-gray-200">
      <div className="flex items-center space-x-2">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
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
                ${
                  inputMessage.trim() && !isLoading
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
        >
          <SendIcon size={20} />
        </button>
      </div>
    </div>
  );
};
