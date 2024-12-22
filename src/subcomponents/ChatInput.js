import { SendIcon, XIcon, FileIcon } from "lucide-react"; // or whichever icons you prefer
import { useState, useRef } from "react";

export const ChatInput = ({
  handleSendMessage,
  inputMessage,
  isLoading,
  setInputMessage,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const uploadFileToOpenAiAndGettingId = async () => {
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("purpose", "assistants"); // Adjust purpose as needed
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
        await sessionStorage.setItem("file_id", result.id);
      }
    } catch (error) {
      console.error("Error uploading file to OpenAI:", error);
    }
  };

  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileUploadButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileDelete = () => {
    setSelectedFile(null);
  };

  const handleSend = () => {
    if (selectedFile) {
      uploadFileToOpenAiAndGettingId(selectedFile);
    } else {
      handleSendMessage({
        inputMessage,
        file: selectedFile,
      });
    }

    // Reset states
    setInputMessage("");
    setSelectedFile(null);
  };

  return (
    <div className="bg-white p-4 border-t border-gray-200">
      {selectedFile && (
        <div className="flex items-center space-x-2 mb-2">
          <FileIcon size={18} className="text-gray-600" />
          <span className="text-sm">{selectedFile.name}</span>
          <button
            type="button"
            onClick={handleFileDelete}
            className="p-1 bg-gray-800 text-white rounded-full hover:bg-gray-700"
          >
            <XIcon size={16} />
          </button>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message"
          className="flex-1 p-2 border rounded-lg resize-none max-h-24 overflow-y-auto"
          rows={1}
          disabled={isLoading}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="
            .csv,
            .pdf,
            .txt,
            .doc,
            .docx,
            application/pdf,
            application/vnd.ms-excel,
            text/csv
          "
          style={{ display: "none" }}
          onChange={handleFileUpload}
          disabled={isLoading}
        />

        <button
          type="button"
          onClick={handleFileUploadButtonClick}
          disabled={isLoading}
          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600"
        >
          Upload
        </button>

        <button
          onClick={handleSend}
          disabled={(!inputMessage.trim() && !selectedFile) || isLoading}
          className={`p-2 rounded-full transition-colors
            ${
              (inputMessage.trim() || selectedFile) && !isLoading
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
