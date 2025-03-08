import React, { useState } from "react";
import { UserIcon, ActivityIcon, CopyIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { nightOwl } from "react-syntax-highlighter/dist/esm/styles/prism";
import { MathJax } from "better-react-mathjax";
import { ASSISTANT } from "../constants/constants";

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
              <div className="relative group">
                <SyntaxHighlighter
                  style={nightOwl}
                  language={match[1]}
                  PreTag="div"
                  className="rounded-xl shadow-lg my-4 text-sm"
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(String(children))
                  }
                  className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <CopyIcon size={14} className="text-white" />
                </button>
              </div>
            ) : (
              <code
                className={`${className} bg-indigo-50 text-indigo-600 rounded-md px-2 py-0.5 text-sm font-mono`}
                {...props}
              >
                {children}
              </code>
            );
          },
          a: ({ node, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-700 underline decoration-2 underline-offset-2 transition-colors"
            >
              {props.children}
            </a>
          ),
        }}
        className="prose prose-lg max-w-none text-gray-700 leading-relaxed prose-headings:text-gray-900 prose-a:text-indigo-600"
      >
        {text}
      </ReactMarkdown>
    );
  };

  return (
    <div
      className={`py-8 w-full ${
        role === "user"
          ? "bg-gradient-to-r from-indigo-50/50 to-purple-50/50"
          : "bg-white"
      }`}
    >
      <div className="flex gap-6 relative group px-6">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transform transition-transform duration-200 hover:scale-110 
          ${
            role === "USER"
              ? "bg-gradient-to-br from-indigo-500 to-purple-600"
              : "bg-gradient-to-br from-emerald-500 to-teal-600"
          }`}
        >
          {role !== ASSISTANT ? (
            <UserIcon className="text-white" size={24} />
          ) : (
            <ActivityIcon className="text-white" size={24} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {mediaUrl && (
            <div className="my-4">
              <img
                src={mediaUrl}
                alt="Uploaded Content"
                className="rounded-2xl shadow-lg max-w-full"
              />
            </div>
          )}
          <div className="text-gray-800">
            {renderContent({ type: "text", text: message })}
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="absolute right-6 top-0 opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 hover:bg-gray-100 rounded-xl"
          aria-label="Copy message"
        >
          <CopyIcon
            className="text-gray-400 hover:text-indigo-600 transition-colors"
            size={18}
          />
          {copied && (
            <span className="absolute right-full mr-2 text-sm font-medium text-emerald-500 whitespace-nowrap bg-white px-2 py-1 rounded-lg shadow-sm">
              Copied ✨
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
