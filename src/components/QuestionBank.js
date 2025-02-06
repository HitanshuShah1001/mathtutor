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
              {
                key: "C",
                option: "$ax^3 + bx^2 + cx + d = 0$ and  $ax^2 + bx + c = 0$ ",
              },
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
  const [showModal, setShowModal] = useState(false);
  const [equationInput, setEquationInput] = useState("");

  // Toggle question selection (checkbox)
  const toggleSelection = (sectionName, questionNumber) => {
    const key = `${sectionName}-${questionNumber}`;
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Extract the LaTeX portion inside the first pair of $...$
  const getEquationToRender = () => {
    console.log(equationInput.split("$"), "equation input");
    console.log(equationInput.length);
    return equationInput.length > 1;
    const matches = equationInput.match(/\$(.*?)\$/);
    return matches && matches[1] ? matches[1] : "";
  };

  // const RenderEquation = () => {
  //   let arr = equationInput.split("$");
  //   for (let i = 0; i < arr.length; i++) {
  //     if (i % 2 == 0) {
  //       <span>{arr[i]}</span>;
  //     } else {
  //       <InlineMath math={arr[i]} />;
  //     }
  //   }
  // };
  return (
    <div style={{ position: "relative", padding: "1rem" }}>
      {/* Button in the top-right corner */}
      <button
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          padding: "0.5rem 1rem",
          cursor: "pointer",
        }}
        onClick={() => setShowModal(true)}
      >
        Add equation
      </button>

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

      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "2rem",
              borderRadius: "8px",
              minWidth: "400px",
              position: "relative",
              display: "flex",
              gap: "1rem",
            }}
          >
            <div style={{ flex: "1" }}>
              <h3>Enter Equation</h3>
              <p style={{ fontSize: "0.9rem" }}>
                Type your equation inside <code>$ ... $</code> to preview.
              </p>
              <input
                type="text"
                value={equationInput}
                onChange={(e) => setEquationInput(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  marginTop: "0.5rem",
                  fontSize: "1rem",
                }}
                placeholder="Example: $x^2 + y^2 = z^2$"
              />
              <button
                style={{
                  marginTop: "1rem",
                  padding: "0.5rem 1rem",
                  cursor: "pointer",
                }}
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
            <div
              style={{
                flex: "1",
                borderLeft: "1px solid #ddd",
                paddingLeft: "1rem",
              }}
            >
              <h3>Preview</h3>
              {getEquationToRender() ? (
                 renderTextWithMath(equationInput)
              ) : (
                <p style={{ fontStyle: "italic", color: "#666" }}>
                  No equation to preview
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
