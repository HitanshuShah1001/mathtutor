import React, { useState } from "react";
import { UserIcon, ActivityIcon, CopyIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { MathJax } from "better-react-mathjax";

export const ChatMessage = ({ message, type }) => {
  const [copied, setCopied] = useState(false);

  // Helper function to check if the message contains LaTeX
  const containsLatex = (text) => {
    const inlineMathRegex = /\\\(.*?\\\)/g;
    const blockMathRegex = /\\\[.*?\\\]/gs;
    return inlineMathRegex.test(text) || blockMathRegex.test(text);
  };

  const handleCopy = () => {
    navigator.clipboard
      .writeText(message)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  // Render function to handle different message types
  const renderMessage = () => {
    // If message contains LaTeX, render with MathJax
    if (containsLatex(message)) {
      return <MathJax>{message}</MathJax>;
    }

    // Otherwise, render with ReactMarkdown
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
        {message}
      </ReactMarkdown>
    );
  };

  return (
    <div
      className={`flex p-4 ${
        type === "user" ? "bg-gray-50" : "bg-white"
      } relative`}
    >
      <div
        className={`w-10 h-10 mr-4 rounded-full flex items-center justify-center 
        ${type === "user" ? "bg-blue-500" : "bg-green-500"}`}
      >
        {type === "user" ? (
          <UserIcon className="text-white" size={20} />
        ) : (
          <ActivityIcon className="text-white" size={20} />
        )}
      </div>
      <div className="flex-1">
        <p
          className={`${type === "user" ? "text-blue-800" : "text-green-800"}`}
        >
          {renderMessage()}
        </p>
      </div>
      {/* Copy Icon positioned at the rightmost of the container */}
      <div
        className="absolute top-1/2 transform -translate-y-1/2 right-4 cursor-pointer"
        onClick={handleCopy}
      >
        <CopyIcon className="text-blue-600 hover:text-blue-800" size={20} />
      </div>
      {/* Feedback for Copy */}
      {copied && (
        <div className="absolute top-1/2 transform -translate-y-1/2 right-12 text-xs text-green-500">
          Copied!
        </div>
      )}
    </div>
  );
};
