import React, { useState, useMemo } from "react";
import { InlineMath } from "react-katex"; // Import KaTeX components
import "katex/dist/katex.min.css"; // Import KaTeX CSS

// Helper function to render text with inline math expressions
const renderTextWithMath = (text) => {
  // Split the text by the $ delimiter
  const parts = text.split("$");
  return parts.map((part, index) => {
    // Odd indices are math expressions (wrapped in $)
    if (index % 2 === 1) {
      return <InlineMath key={index} math={part} />;
    }
    // Even indices are plain text
    return <span key={index}>{part}</span>;
  });
};

const QuestionBank = () => {
  const sections = useMemo(
    () => [
      {
        name: "A",
        sectionNumberOfQuestions: 4,
        sectionMarks: 1,
        sectionTotalMarks: 4,
        questions: [
          {
            questionNumber: 1,
            question: "What is the standard form of a quadratic equation?",
            isMCQ: true,
            options: [
              { key: "A", option: "$ax^2 + bx + c = 0$" },
              { key: "B", option: "$ax + b = 0$" },
              { key: "C", option: "$ax^3 + bx^2 + cx + d = 0$ and  $ax^2 + bx + c = 0$ " },
              { key: "D", option: "$ax^2 + bx = c$" },
            ],
            correctAnswer: "A",
            correctAnswerLabel: "A",
            correctAnswerOption: "$ax^2 + bx + c = 0$",
            calculationSteps: [
              "The standard form of a quadratic equation is $ax^2 + bx + c = 0$ and  $ax^2 + bx + c = 0$  .",
            ],
          },
        ],
      },
      {
        name: "B",
        sectionNumberOfQuestions: 2,
        sectionMarks: 2,
        sectionTotalMarks: 4,
        questions: [
          {
            questionNumber: 1,
            question: "Solve the equation $x^2 - 5x + 6 = 0$.",
            isMCQ: false,
            solution: "The solutions are $x = 2$ and $x = 3$.",
          },
          {
            questionNumber: 2,
            question: "Find the derivative of $f(x) = 3x^2 + 2x + 1$.",
            isMCQ: false,
            solution: "The derivative is $f'(x) = 6x + 2$.",
          },
        ],
      },
    ],
    []
  );

  const [selected, setSelected] = useState({});

  const toggleSelection = (sectionName, questionNumber) => {
    const key = `${sectionName}-${questionNumber}`;
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div>
      {sections.map((section) => (
        <div key={section.name} style={{ marginBottom: "2em" }}>
          <h2>Section {section.name}</h2>
          <p>
            (Questions: {section.sectionNumberOfQuestions} x Marks per Q:{" "}
            {section.sectionMarks} = Total Marks: {section.sectionTotalMarks})
          </p>
          <ol>
            {section.questions.map((question) => {
              const uniqueId = `${section.name}-${question.questionNumber}`;
              return (
                <li key={uniqueId} style={{ marginBottom: "1em" }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={selected[uniqueId] || false}
                      onChange={() =>
                        toggleSelection(section.name, question.questionNumber)
                      }
                      style={{ marginRight: "8px" }}
                    />
                    <span>{renderTextWithMath(question.question)}</span>
                  </div>
                  {question.isMCQ && question.options && (
                    <ul style={{ marginLeft: "2em", marginTop: "0.5em" }}>
                      {question.options.map((opt) => (
                        <li key={opt.key}>
                          <strong>{opt.key}:</strong>{" "}
                          {renderTextWithMath(opt.option)}
                        </li>
                      ))}
                    </ul>
                  )}
                  {!question.isMCQ && question.solution && (
                    <div style={{ marginLeft: "2em", marginTop: "0.5em" }}>
                      <strong>Solution:</strong>{" "}
                      {renderTextWithMath(question.solution)}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
};

export default QuestionBank;