import React, { useState } from "react";
import { UserIcon, ActivityIcon, CopyIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { MathJax } from "better-react-mathjax";

export const containsLatex = (text) => {
  const inlineMathRegex = /\\\(.*?\\\)/g;
  const blockMathRegex = /\\\[.*?\\\]/gs;
  return inlineMathRegex.test(text) || blockMathRegex.test(text);
};

export const ChatMessage = ({ message, role, mediaUrl }) => {
  const [copied, setCopied] = useState(false);  

  const handleCopy = () => {
    const textToCopy = Array.isArray(message)
      ? message
          .filter((item) => item.type === "text")
          .map((item) => item.text)
          .join("\n")
      : message;

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  const renderContent = (content) => {
    const text = content.text;
    if (containsLatex(text)) {
      return <MathJax>{text}</MathJax>;
    }
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <SyntaxHighlighter
                style={materialDark}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          a: ({ node, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            />
          ),
        }}
        className="prose max-w-full"
      >
        {text}
      </ReactMarkdown>
    );
  };

  return (
    <div
      className={`flex p-4 ${
        role === "user" ? "bg-gray-50" : "bg-white"
      } relative group hover:bg-gray-50 transition-colors`}
    >
      {/* Avatar Section */}
      <div
        className={`w-10 h-10 shrink-0 mr-4 rounded-full flex items-center justify-center 
        ${role === "USER" ? "bg-blue-500" : "bg-green-500"}`}
      >
        {role === "USER" ? (
          <UserIcon className="text-white" size={20} />
        ) : (
          <ActivityIcon className="text-white" size={20} />
        )}
      </div>

      {/* Content Section */}
      <div className="flex-1 min-w-0 pr-12"> {/* Added pr-12 for copy icon space */}
        {mediaUrl && (
          <div className="my-2">
            <img
              src={mediaUrl}
              alt="Uploaded Content"
              className="max-w-full rounded-lg"
            />
          </div>
        )}
        <div
          className={`${role === "user" ? "text-blue-800" : "text-green-800"}`}
        >
          {renderContent({ type: "text", text: message })}
        </div>
      </div>

      {/* Copy Button Section */}
      <div
        className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        <button
          className="p-2 hover:bg-gray-200 rounded-full transition-colors flex items-center gap-2"
          aria-label="Copy message"
        >
          <CopyIcon className="text-gray-500 hover:text-gray-700" size={20} />
          {copied && (
            <span className="text-xs text-green-500 absolute right-full mr-2 whitespace-nowrap">
              Copied!
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatMessage;