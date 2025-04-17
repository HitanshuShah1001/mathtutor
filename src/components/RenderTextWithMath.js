import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import "katex/dist/katex.min.css";

export const renderTextWithMath = (text) => {
  if (!text) return null;

  const removeHtmlTags = (str) => {
    return str.replace(/<[^>]*>/g, "");
  };

  const noTagsText = removeHtmlTags(text);

  const parts = noTagsText.split("$");
  return (
    <div style={{ display: "inline", textAlign: "justify",whiteSpace:"pre-wrap" }}>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <InlineMath key={index} math={part} />
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </div>
  );
};

export const renderTruncatedTextWithMath = (text, maxLength = 100) => {
  if (!text) return null;

  const removeHtmlTags = (str) => {
    return str.replace(/<[^>]*>/g, "");
  };

  // Remove HTML tags first
  const noTagsText = removeHtmlTags(text);

  // Truncate text if it's too long
  let truncated = noTagsText;
  if (noTagsText.length > 100) {
    truncated = noTagsText.slice(0, maxLength) + "...";
  }

  // Split on `$` to handle inline math
  const parts = truncated.split("$");

  return (
    <div style={{ display: "inline", textAlign: "justify", marginRight: 5,
    whiteSpace:"pre-wrap" }}>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <InlineMath key={index} math={part} />
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </div>
  );
};
