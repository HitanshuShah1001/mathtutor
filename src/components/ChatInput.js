import { SendIcon, ImageIcon, XIcon } from "lucide-react";
import { useState, useRef } from "react";
import AWS from "aws-sdk/global"; // Import global AWS namespace (recommended)
import S3 from "aws-sdk/clients/s3";

export const ChatInput = ({
  handleSendMessage,
  inputMessage,
  isLoading,
  setInputMessage,
}) => {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const inputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    console.log(file,"file")
    if (file) {
      // Revoke the old object URL to avoid memory leaks
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);
      setImageFile(file);
    }
  };

  const uploadImageToS3 = async (e) => {
    const file = e.target.files[0];
    
    const S3_BUCKET = process.env.REACT_APP_S3_BUCKET_NAME;
    const REGION = process.env.REACT_APP_S3_AWS_REGION;
    AWS.config.update({
      accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
      region: REGION
    });
    const s3 = new S3({
      region: REGION
    });
    const params = {
      Bucket: S3_BUCKET,
      Key: file.name,
      Body: file,
    };

    try {
      const upload = await s3.putObject(params).promise();
      console.log(upload);
      alert("File uploaded successfully.");
    } catch (error) {
      console.error(error);
      alert("Error uploading file: " + error.message); // Inform user about the error
    }
  };
  
  const handleImageUploadButtonClick = () => {
    inputRef.current.click();
  };

  const handleImageDelete = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImageFile(null);
    setImagePreviewUrl(null);
  };

  const handleSend = () => {
    handleSendMessage({ text: inputMessage, image: imageFile });
    setInputMessage("");
    setImageFile(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
  };

  return (
    <div className="bg-white p-4 border-t border-gray-200">
      {imagePreviewUrl && (
        <div className="relative mt-2 inline-block">
          <img
            src={imagePreviewUrl}
            alt="Selected"
            className="w-full h-auto max-h-64 object-contain rounded-lg"
          />
          <button
            type="button"
            onClick={handleImageDelete}
            className="absolute top-1 right-1 p-1 bg-gray-800 bg-opacity-50 rounded-full text-white hover:bg-opacity-75"
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
          placeholder="Send a message"
          className="flex-1 p-2 border rounded-lg resize-none max-h-24 overflow-y-auto"
          rows={1}
        />
        {/* Hidden file input for image upload */}
        <input
          type="file"
          accept="image/*"
          id="image-upload"
          style={{ display: "none" }}
          onChange={uploadImageToS3}
          ref={inputRef}
        />
        {/* Image upload button */}
        <button
          type="button"
          onClick={handleImageUploadButtonClick}
          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600"
        >
          <ImageIcon size={20} />
        </button>
        <button
          onClick={handleSend}
          disabled={(!inputMessage.trim() && !imageFile) || isLoading}
          className={`p-2 rounded-full 
                ${
                  (inputMessage.trim() || imageFile) && !isLoading
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
        >
          <SendIcon size={20} />
        </button>
      </div>
      {/* Display selected image preview with delete option */}
      
    </div>
  );
};
