import { SendIcon, XIcon, FileIcon } from "lucide-react"; // or whichever icons you prefer
import { useState, useRef } from "react";

export const ChatInput = ({
  handleSendMessage,
  inputMessage,
  isLoading,
  setInputMessage,
}) => {
  // Keep track of the selected file (if any)
  const [selectedFile, setSelectedFile] = useState(null);

  // This ref helps programmatically trigger the hidden file input
  const fileInputRef = useRef(null);

  /**
   * Called when a user selects a file.
   * Here we only handle the first file: `files?.[0]`.
   */
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  /**
   * Trigger the click event on the hidden file input.
   */
  const handleFileUploadButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  /**
   * Remove the selected file.
   */
  const handleFileDelete = () => {
    setSelectedFile(null);
  };

  /**
   * Send the message (and optionally the file) up to the parent.
   */
  const handleSend = () => {
    // We pass the file in the same object as the message text
    handleSendMessage({
      inputMessage,
      file: selectedFile,
    });

    // Reset states
    setInputMessage("");
    setSelectedFile(null);
  };

  return (
    <div className="bg-white p-4 border-t border-gray-200">
      {/* Show the selected file's name (if any), with an option to remove it. */}
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
            // Press Enter (without Shift) to send the message
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

        {/* Hidden file input to select .csv, .pdf, .txt, .doc, etc. */}
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

        {/* Button to trigger file selection */}
        <button
          type="button"
          onClick={handleFileUploadButtonClick}
          disabled={isLoading}
          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600"
        >
          Upload
        </button>

        {/* Send button */}
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
