import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

export const renderTextWithMath = (text) => {
  if (!text) return null;

  const containerStyle = {
    display: "inline-block",
    whiteSpace: "pre-wrap",
    textAlign: "justify",
    marginRight: 5,
    height: 50, // fixed height
  };

  // detect HTML
  const isHtml = /<[^>]+>/.test(text);

  if (isHtml) {
    return (
      <div style={containerStyle} dangerouslySetInnerHTML={{ __html: text }} />
    );
  }

  // plain text: truncate and split math
  let truncated = text;

  const parts = truncated.split(/\$([^$]+)\$/g);

  return (
    <div style={containerStyle}>
      {parts.map((part, idx) =>
        idx % 2 === 1 ? (
          <InlineMath key={idx} math={part} />
        ) : (
          <span key={idx}>{part}</span>
        )
      )}
    </div>
  );
};

export const renderTruncatedTextWithMath = (text, maxLength = 100) => {
  if (!text) return null;

  const containerStyle = {
    display: "inline-block",
    whiteSpace: "pre-wrap",
    textAlign: "justify",
    marginRight: 5,
    height: 50, // fixed height
    overflowY: "auto", // scroll if too tall
  };

  // detect HTML
  const isHtml = /<[^>]+>/.test(text);

  if (isHtml) {
    return (
      <div style={containerStyle} dangerouslySetInnerHTML={{ __html: text }} />
    );
  }

  // plain text: truncate and split math
  let truncated = text;
  if (text.length > maxLength) {
    truncated = text.slice(0, maxLength) + "...";
  }

  const parts = truncated.split(/\$([^$]+)\$/g);

  return (
    <div style={containerStyle}>
      {parts.map((part, idx) =>
        idx % 2 === 1 ? (
          <InlineMath key={idx} math={part} />
        ) : (
          <span key={idx}>{part}</span>
        )
      )}
    </div>
  );
};
