import React, { useState, useEffect } from "react";

/**
 * Component that renders a list of sections with questions.
 * Each question is displayed with a checkbox.
 *
 * Props:
 *  - sections: Array of section objects. Each section object should have:
 *      - name: string (e.g., "A", "B", etc.)
 *      - sectionNumberOfQuestions: number
 *      - sectionMarks: number
 *      - sectionTotalMarks: number
 *      - questions: array of question objects. Each question object can have:
 *            - questionNumber: number
 *            - question: string (which may contain math, e.g., "$x^2$")
 *            - isMCQ: boolean
 *            - options: (if isMCQ) array of { key: string, option: string }
 *
 *  - onSelectionChange (optional): Callback function receiving an array of the unique IDs of selected questions.
 */
const QuestionBank = () => {
  const sections = [
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
            { key: "A", option: "ax^2 + bx + c = 0" },
            { key: "B", option: "ax + b = 0" },
            { key: "C", option: "ax^3 + bx^2 + cx + d = 0" },
            { key: "D", option: "ax^2 + bx = c" },
          ],
        },
        {
          questionNumber: 2,
          question:
            "What is the discriminant (D) of the quadratic equation 4x^2 - 3x + 2 = 0?",
          isMCQ: true,
          options: [
            { key: "A", option: "1" },
            { key: "B", option: "-23" },
            { key: "C", option: "7" },
            { key: "D", option: "19" },
          ],
        },
        {
          questionNumber: 3,
          question:
            "Which of the following is a solution to the quadratic equation x^2 - 5x + 6 = 0?",
          isMCQ: true,
          options: [
            { key: "A", option: "x = 2" },
            { key: "B", option: "x = 3" },
            { key: "C", option: "x = 2 and x = 3" },
            { key: "D", option: "x = 1 and x = 6" },
          ],
        },
        {
          questionNumber: 4,
          question:
            "What is the nature of the roots for the quadratic equation 3x^2 - 4x + 5 = 0?",
          isMCQ: true,
          options: [
            { key: "A", option: "Real and distinct" },
            { key: "B", option: "Real and equal" },
            { key: "C", option: "Imaginary" },
            { key: "D", option: "None of the above" },
          ],
        },
      ],
    },
    {
      name: "B",
      sectionNumberOfQuestions: 1,
      sectionMarks: 1,
      sectionTotalMarks: 1,
      questions: [
        {
          questionNumber: 1,
          question:
            "Explain how to determine whether a given equation is quadratic or not, with an example.",
          isMCQ: false,
        },
      ],
    },
    {
      name: "C",
      sectionNumberOfQuestions: 1,
      sectionMarks: 2,
      sectionTotalMarks: 2,
      questions: [
        {
          questionNumber: 1,
          question:
            "Solve the quadratic equation x^2 - 4x - 5 = 0 using the factorization method.",
          isMCQ: false,
        },
      ],
    },
    {
      name: "D",
      sectionNumberOfQuestions: 1,
      sectionMarks: 3,
      sectionTotalMarks: 3,
      questions: [
        {
          questionNumber: 1,
          question:
            "Solve the quadratic equation 2x^2 + 3x - 2 = 0 using the quadratic formula.",
          isMCQ: false,
        },
      ],
    },
  ];

  // Track selected questions by a unique key: sectionName-questionNumber
  const [selected, setSelected] = useState({});

  const onSelectionChange = (selectedIds) => {
    console.log("Selected Questions:", selectedIds);
  };

  // Toggle the selection state of a question
  const toggleSelection = (sectionName, questionNumber) => {
    const key = `${sectionName}-${questionNumber}`;
    setSelected((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      if (onSelectionChange) {
        const selectedIds = Object.entries(updated)
          .filter(([, value]) => value)
          .map(([k]) => k);
        onSelectionChange(selectedIds);
      }
      return updated;
    });
  };

  // Call MathJax.typeset() after every render so that any math is re‑typeset.
  useEffect(() => {
    if (window.MathJax && window.MathJax.typeset) {
      window.MathJax.typeset();
    }
  }, [sections, selected]);

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
                  {/* A container for each question */}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={selected[uniqueId] || false}
                      onChange={() =>
                        toggleSelection(section.name, question.questionNumber)
                      }
                      style={{ marginRight: "8px" }}
                    />
                    <span
                      dangerouslySetInnerHTML={{ __html: question.question }}
                    />
                  </div>
                  {/* If the question is an MCQ and has options, list them */}
                  {question.isMCQ && question.options && (
                    <ul style={{ marginLeft: "2em", marginTop: "0.5em" }}>
                      {question.options.map((opt) => (
                        <li key={opt.key}>
                          <strong>{opt.key}:</strong> {opt.option}
                        </li>
                      ))}
                    </ul>
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
