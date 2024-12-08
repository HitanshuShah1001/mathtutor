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
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  // Render content based on its type
  const renderContent = (content) => {
    if (content.type === "text") {
      const text = content.text;
      // If the text contains LaTeX, render with MathJax
      if (containsLatex(text)) {
        return <MathJax>{text}</MathJax>;
      }
      // Otherwise, render as Markdown
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
    } else if (content.type === "image_url") {
      //console.log(content.image_url,"content image url")
      return (
        <div className="my-2">
          <img
            src={content.image_url.url}
            alt="Uploaded Content"
            className="max-w-full rounded-lg"
          />
        </div>
      );
    }
    return null;
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
        {Array.isArray(message) ? (
          message.map((content, index) => (
            <div key={index}>{renderContent(content)}</div>
          ))
        ) : (
          <p
            className={`${type === "user" ? "text-blue-800" : "text-green-800"}`}
          >
            {renderContent({ type: "text", text: message })}
          </p>
        )}
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
