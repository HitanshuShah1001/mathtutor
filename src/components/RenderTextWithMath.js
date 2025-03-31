import { InlineMath } from "react-katex";

export const renderTextWithMath = (text) => {
  if (!text) return null;
  const parts = text.split("$");
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <InlineMath key={index} math={part} />
    ) : (
      <span
        key={index}
        style={{ whiteSpace: "pre-wrap", textAlign: "justify" }}
      >
        {part}
      </span>
    )
  );
};

export const renderTruncatedTextWithMath = (text, maxLength = 600) => {
  if (!text) return null;
  let truncated = text;
  if (text.length > 100) {
    truncated = text.slice(0, 100) + "...";
  }

  const parts = truncated.split("$");

  return (
    <div style={{ display: "inline" }}>
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
