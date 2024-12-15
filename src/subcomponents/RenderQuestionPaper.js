import DOMPurify from "dompurify";

export const QuestionPaper = ({ htmlContent }) => {
    const sanitizedHTML = DOMPurify.sanitize(htmlContent);

    return (
      <div
        className="question-paper"
        dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
      />
    );
  };