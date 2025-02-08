import React, { useState, useEffect } from "react";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import { ACCESS_KEY, BASE_URL_API } from "../constants/constants";

// Helper to split text by $ signs and render inline math using react-katex.
const renderTextWithMath = (text) => {
  const parts = text.split("$");
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <InlineMath key={index} math={part} />
    ) : (
      <span key={index}>{part}</span>
    )
  );
};

const QuestionBank = () => {
  // Existing state variables for listing/filtering questions.
  const [questions, setQuestions] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    marks: "",
    type: "",
    difficulty: "",
  });
  const marks = Array.from({ length: 10 }, (_, i) => i + 1);
  const types = ["MCQ", "Descriptive"];
  const difficulties = ["EASY", "MEDIUM", "HARD"];

  // New state for showing the “Add Question” modal.
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    type: "MCQ",
    questionText: "",
    marks: "",
    difficulty: "",
    options: [
      { key: "A", optionText: "" },
      { key: "B", optionText: "" },
      { key: "C", optionText: "" },
      { key: "D", optionText: "" },
    ],
  });

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Fetch questions (using your paginated questions API)
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        limit: "10000",
        ...(filters.marks && { marks: filters.marks }),
        ...(filters.type && { type: filters.type }),
        ...(filters.difficulty && {
          difficulty: filters.difficulty.toLowerCase(),
        }),
      });
      const accesskey = localStorage.getItem(ACCESS_KEY);
      const response = await fetch(
        `${BASE_URL_API}/question/getPaginatedQuestions?${queryParams}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: accesskey,
          },
        }
      );
      const data = await response.json();
      setQuestions(data.questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
    }
    setLoading(false);
  };

  // Toggle the selection state for a given question.
  const toggleSelection = (questionId) => {
    setSelected((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Handle change for filters.
  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  // When “Generate Question Paper” is clicked.
  const handleGenerateQuestionPaper = () => {
    const selectedQuestions = questions.filter((q) => selected[q.id]);
    console.log("Selected questions:", selectedQuestions);
    // Add your logic for generating a question paper.
  };

  // -------------------------------------------------------------------
  // HANDLING THE NEW QUESTION FORM (Add / Upsert)
  // -------------------------------------------------------------------

  // For any text input, when the user presses Command + "$",
  // we insert a "$" at the current cursor position.
  const handleMathKeyDown = (e, field, index = null) => {
    if (e.metaKey && e.key === "$") {
      e.preventDefault();
      const input = e.target;
      const { selectionStart, selectionEnd, value } = input;
      const newValue =
        value.slice(0, selectionStart) + "$" + value.slice(selectionEnd);
      if (field === "questionText") {
        setNewQuestion((prev) => ({ ...prev, questionText: newValue }));
      } else if (field === "option" && index !== null) {
        setNewQuestion((prev) => {
          const options = [...prev.options];
          options[index] = { ...options[index], optionText: newValue };
          return { ...prev, options };
        });
      }
      // Place the caret immediately after the inserted "$".
      setTimeout(() => {
        input.selectionStart = input.selectionEnd = selectionStart + 1;
      }, 0);
    }
  };

  // Generic change handler for our new question form.
  // For the question text, marks, difficulty, type, and for option text.
  const handleNewQuestionChange = (e, field, index = null) => {
    if (field === "questionText") {
      setNewQuestion((prev) => ({ ...prev, questionText: e.target.value }));
    } else if (field === "marks" || field === "difficulty" || field === "type") {
      setNewQuestion((prev) => ({ ...prev, [field]: e.target.value }));
    } else if (field === "option" && index !== null) {
      setNewQuestion((prev) => {
        const options = [...prev.options];
        options[index] = { ...options[index], optionText: e.target.value };
        return { ...prev, options };
      });
    }
  };

  // Submit the new question by calling the upsert API.
  const handleNewQuestionSubmit = async () => {
    try {
      const accesskey = localStorage.getItem(ACCESS_KEY);
      // Prepare the payload; note that the API expects difficulty to be lowercase.
      const payload = {
        ...newQuestion,
        difficulty: newQuestion.difficulty.toLowerCase(),
      };
      // If the question type is Descriptive, remove the options field.
      if (newQuestion.type !== "MCQ") {
        delete payload.options;
      }
      const response = await fetch(`${BASE_URL_API}/question/upsert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: accesskey,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      console.log("Question upserted:", data);
      // Reset the form and close the modal.
      setShowAddQuestionModal(false);
      setNewQuestion({
        type: "MCQ",
        questionText: "",
        marks: "",
        difficulty: "",
        options: [
          { key: "A", optionText: "" },
          { key: "B", optionText: "" },
          { key: "C", optionText: "" },
          { key: "D", optionText: "" },
        ],
      });
      // Refresh the question list.
      fetchQuestions();
    } catch (error) {
      console.error("Error upserting question:", error);
    }
  };

  return (
    <div className="p-6 relative">
      {/* ---------------- Filter Section ---------------- */}
      <div className="flex gap-4 mb-6">
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium">Marks</label>
          <select
            value={filters.marks}
            onChange={(e) => handleFilterChange("marks", e.target.value)}
            className="border rounded p-2"
          >
            <option value="">All</option>
            {marks.map((mark) => (
              <option key={mark} value={mark}>
                {mark}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium">Type</label>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange("type", e.target.value)}
            className="border rounded p-2"
          >
            <option value="">All</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium">Difficulty</label>
          <select
            value={filters.difficulty}
            onChange={(e) => handleFilterChange("difficulty", e.target.value)}
            className="border rounded p-2"
          >
            <option value="">All</option>
            {difficulties.map((diff) => (
              <option key={diff} value={diff}>
                {diff}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ---------------- Action Buttons ---------------- */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleGenerateQuestionPaper}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Generate Question Paper
        </button>
        <button
          onClick={() => setShowAddQuestionModal(true)}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Add Question
        </button>
      </div>

      {/* ---------------- Questions List ---------------- */}
      {loading ? (
        <div className="text-center py-4">Loading questions...</div>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <div key={question.id} className="border rounded p-4">
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={selected[question.id] || false}
                  onChange={() => toggleSelection(question.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="mb-2">
                    {renderTextWithMath(question.questionText)}
                  </div>
                  {question.type === "MCQ" && (
                    <div className="ml-4 space-y-2">
                      {question.options.map((option) => (
                        <div
                          key={option.key}
                          className="flex items-center gap-2"
                        >
                          <span className="font-bold">{option.key}:</span>
                          {renderTextWithMath(option.optionText)}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 text-sm text-gray-600">
                    Marks: {question.marks} | Type: {question.type} | Difficulty:{" "}
                    {question.difficulty}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---------------- Add Question Modal ---------------- */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add New Question</h3>

            {/* Question Type */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">Question Type</label>
              <select
                value={newQuestion.type}
                onChange={(e) => handleNewQuestionChange(e, "type")}
                className="w-full border rounded p-2"
              >
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Question Text */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">Question Text</label>
              <textarea
                value={newQuestion.questionText}
                onChange={(e) => handleNewQuestionChange(e, "questionText")}
                onKeyDown={(e) => handleMathKeyDown(e, "questionText")}
                className="w-full border rounded p-2"
                placeholder="Enter question text. Use Command + $ to add math equations."
                rows="4"
              />
              <div className="mt-2 text-sm text-gray-500">
                Preview: {renderTextWithMath(newQuestion.questionText)}
              </div>
            </div>

            {/* Options (only for MCQ) */}
            {newQuestion.type === "MCQ" && (
              <div className="mb-4">
                <label className="block mb-1 font-medium">Options</label>
                {newQuestion.options.map((option, index) => (
                  <div key={option.key} className="mb-2">
                    <label className="block text-sm font-medium">
                      Option {option.key}
                    </label>
                    <input
                      type="text"
                      value={option.optionText}
                      onChange={(e) =>
                        handleNewQuestionChange(e, "option", index)
                      }
                      onKeyDown={(e) => handleMathKeyDown(e, "option", index)}
                      className="w-full border rounded p-2"
                      placeholder={`Enter option ${option.key} text. Use Command + $ for math.`}
                    />
                    <div className="mt-1 text-sm text-gray-500">
                      Preview: {renderTextWithMath(option.optionText)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Marks and Difficulty */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block mb-1 font-medium">Marks</label>
                <select
                  value={newQuestion.marks}
                  onChange={(e) => handleNewQuestionChange(e, "marks")}
                  className="w-full border rounded p-2"
                >
                  <option value="">Select Marks</option>
                  {marks.map((mark) => (
                    <option key={mark} value={mark}>
                      {mark}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block mb-1 font-medium">Difficulty</label>
                <select
                  value={newQuestion.difficulty}
                  onChange={(e) => handleNewQuestionChange(e, "difficulty")}
                  className="w-full border rounded p-2"
                >
                  <option value="">Select Difficulty</option>
                  {difficulties.map((diff) => (
                    <option key={diff} value={diff}>
                      {diff}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowAddQuestionModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleNewQuestionSubmit}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Save Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
