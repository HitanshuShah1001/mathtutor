import { SendIcon, XIcon, FileIcon } from "lucide-react";
import { useState, useRef } from "react";

export const ChatInput = ({
  handleSendMessage,
  inputMessage,
  isLoading,
  setInputMessage,
  setChatLevelFileId,
  chatLevelFileId,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const uploadFileToOpenAiAndGettingId = async () => {
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("purpose", "assistants");
    try {
      const response = await fetch("https://api.openai.com/v1/files", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        },
        body: formData,
      });
      const result = await response.json();
      if (result?.error) {
        alert(result?.error?.message);
      } else {
        alert("File uploaded successfully!");
        setChatLevelFileId(result.id);
      }
    } catch (error) {
      console.error("Error uploading file to OpenAI:", error);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileDelete = () => {
    setSelectedFile(null);
  };

  const handleSend = () => {
    if (selectedFile) {
      uploadFileToOpenAiAndGettingId(selectedFile);
      handleSendMessage({
        inputMessage,
        file_id: chatLevelFileId,
      });
    } else {
      handleSendMessage({
        inputMessage,
      });
    }
    setInputMessage("");
    setSelectedFile(null);
  };

  return (
    <div className="w-full px-6 pb-6 pt-2 bg-gradient-to-t from-white via-white to-transparent">
      <div className="w-full">
        {selectedFile && (
          <div className="flex items-center gap-3 mb-3 bg-indigo-50 p-3 rounded-xl">
            <FileIcon size={18} className="text-indigo-600" />
            <span className="text-sm text-indigo-900 font-medium truncate flex-1">{selectedFile.name}</span>
            <button
              type="button"
              onClick={handleFileDelete}
              className="p-1.5 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              <XIcon size={16} className="text-indigo-600" />
            </button>
          </div>
        )}

        <div className="flex gap-3 items-end bg-white border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            className="flex-1 p-4 max-h-48 min-h-[56px] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-700 placeholder-gray-400 text-base leading-relaxed"
            rows={1}
            disabled={isLoading}
          />

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.pdf,.txt,.doc,.docx,application/pdf,application/vnd.ms-excel,text/csv"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isLoading}
          />

          <div className="flex gap-2 px-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="p-3 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-indigo-600"
            >
              <FileIcon size={20} />
            </button>

            <button
              onClick={handleSend}
              disabled={(!inputMessage.trim() && !selectedFile) || isLoading}
              className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center min-w-[44px] ${
                (inputMessage.trim() || selectedFile) && !isLoading
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <SendIcon size={20} />
            </button>
          </div>
        </div>

        <div className="text-left mt-3">
          <p className="text-xs text-gray-400">
            Powered by Tutorless AI
          </p>
        </div>
      </div>
    </div>
  );
};
