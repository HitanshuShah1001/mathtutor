import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Trash } from "lucide-react";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
// Import the deleteRequest function from its module (adjust the path as needed)
import { deleteRequest } from "../utils/ApiCall";
import { BASE_URL_API } from "../constants/constants";

const QuestionPaperEditPage = () => {
  const { docId } = useParams();
  const location = useLocation();

  const [sections, setSections] = useState([]);

  // Keep the "original" (API data) & "edited" (UI changes) versions of the currently selected question
  const [originalQuestion, setOriginalQuestion] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState(null);

  // Left-panel search
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (location.state && location.state.sections) {
      setSections(location.state.sections);
    }
    // else: optionally fetch data by docId from your API
  }, [location.state]);

  // When a question is clicked in the left panel
  const handleQuestionClick = (question) => {
    setOriginalQuestion(question);
    setEditedQuestion(JSON.parse(JSON.stringify(question)));
    // Deep copy to safely edit
  };

  // We'll compare the entire question object in `editedQuestion` vs. `originalQuestion`
  // If they differ, something changed -> show Save button
  const isModified =
    editedQuestion && originalQuestion
      ? JSON.stringify(editedQuestion) !== JSON.stringify(originalQuestion)
      : false;

  // ----- Inline math renderer (no truncation) -----
  const renderTextWithMath = (text) => {
    if (!text) return null;
    const parts = text.split("$");
    return parts.map((part, index) =>
      index % 2 === 1 ? (
        <InlineMath key={index} math={part} />
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  // ----- Truncated math renderer (for left panel) -----
  const renderTruncatedTextWithMath = (text, maxLength = 60) => {
    if (!text) return null;
    let truncated = text;
    if (text.length > maxLength) {
      truncated = text.slice(0, maxLength) + "...";
    }
    const parts = truncated.split("$");
    return parts.map((part, index) =>
      index % 2 === 1 ? (
        <InlineMath key={index} math={part} />
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  // Filter sections/questions by searchTerm
  const getFilteredSections = () => {
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = sections.map((section) => {
      const filteredQuestions = section.questions.filter((q) =>
        q.questionText.toLowerCase().includes(lowerSearch)
      );
      return { ...section, questions: filteredQuestions };
    });
    return filtered.filter((section) => section.questions.length > 0);
  };

  const visibleSections = getFilteredSections();

  // Check if the current question text has any `$` => show math preview column
  const isEditingMath = editedQuestion?.questionText?.includes("$");

  // ------ Handlers for changes in the right panel -------
  const handleQuestionTextChange = (e) => {
    const newText = e.target.value;
    setEditedQuestion((prev) => ({
      ...prev,
      questionText: newText,
    }));
  };

  // Editable chip handlers for type, difficulty, marks
  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setEditedQuestion((prev) => ({
      ...prev,
      type: newType,
    }));
  };

  const handleDifficultyChange = (e) => {
    const newDiff = e.target.value;
    setEditedQuestion((prev) => ({
      ...prev,
      difficulty: newDiff,
    }));
  };

  const handleMarksChange = (e) => {
    const newMarks = e.target.value;
    setEditedQuestion((prev) => ({
      ...prev,
      marks: newMarks,
    }));
  };

  // Editable option handler
  const handleOptionChange = (index, newValue) => {
    setEditedQuestion((prev) => {
      const updatedOptions = [...(prev.options || [])];
      updatedOptions[index] = {
        ...updatedOptions[index],
        option: newValue,
      };
      return { ...prev, options: updatedOptions };
    });
  };

  // Simulate "save" to server
  const handleSave = () => {
    alert(
      "Save feature not yet implemented. You would send updates to the server here."
    );
    // After successful save, you might do:
    // setOriginalQuestion({ ...editedQuestion });
  };

  // ----- Delete Question Handler with API integration -----
  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      try {
        // Call the delete API; sending the id as a parameter
        await deleteRequest(`${BASE_URL_API}/question/delete`, {
          id: questionId,
        });
        // Update local state after successful deletion
        const updatedSections = sections.map((section) => {
          const updatedQuestions = section.questions.filter(
            (q) => q.id !== questionId
          );
          return { ...section, questions: updatedQuestions };
        });
        setSections(updatedSections);
        // Clear selection if the deleted question was selected
        if (editedQuestion && editedQuestion.id === questionId) {
          setOriginalQuestion(null);
          setEditedQuestion(null);
        }
      } catch (error) {
        console.error("Error deleting question:", error);
      }
    }
  };

  return (
    <div className="flex h-screen">
      {/* LEFT PANEL: Sections & Questions (Cards) */}
      <div className="w-1/3 border-r p-4 overflow-y-auto">
        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search questions..."
            className="w-full p-2 border rounded"
          />
        </div>

        {visibleSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            <h3 className="font-bold text-lg mb-2">Section {section.name}</h3>
            {section.questions.map((question) => {
              const isSelected = editedQuestion?.id === question.id;
              return (
                <div
                  key={question.id}
                  onClick={() => handleQuestionClick(question)}
                  className={`flex justify-between items-center p-3 mb-3 rounded shadow cursor-pointer transition-colors 
                    ${
                      isSelected
                        ? "bg-blue-50 border-l-4 border-blue-500"
                        : "bg-white hover:bg-gray-100"
                    }
                  `}
                >
                  <div>
                    {renderTruncatedTextWithMath(question.questionText, 60)}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteQuestion(question.id);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* RIGHT PANEL: Selected Question Edit */}
      <div className="w-2/3 p-4 overflow-y-auto">
        {!originalQuestion ? (
          <div className="text-gray-500">Select a question to edit</div>
        ) : (
          <div className="space-y-6">
            {/* Title & Save Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Question Details</h2>
              {isModified ? (
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-500 text-white rounded shadow-md"
                >
                  Save
                </button>
              ) : (
                <div />
              )}
            </div>

            {/* Editable Question Fields */}
            <div className="flex flex-col md:flex-row md:items-start gap-4">
              {/* Left Column: Editable Fields */}
              <div className="md:w-1/2">
                {/* Chips for Type, Difficulty, Marks */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {/* Type Chip */}
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Type:</span>
                    <input
                      type="text"
                      value={editedQuestion.type || ""}
                      onChange={handleTypeChange}
                      className="w-auto bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold shadow-sm focus:outline-none"
                    />
                  </div>
                  {/* Difficulty Chip */}
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Difficulty:</span>
                    <input
                      type="text"
                      value={editedQuestion.difficulty || ""}
                      onChange={handleDifficultyChange}
                      className="w-auto bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold shadow-sm focus:outline-none"
                    />
                  </div>
                  {/* Marks Chip */}
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Marks:</span>
                    <input
                      type="number"
                      min="0"
                      value={editedQuestion.marks || ""}
                      onChange={handleMarksChange}
                      className="w-auto bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold shadow-sm focus:outline-none"
                    />
                  </div>
                </div>

                {/* Editable Question Text */}
                <div className="mt-4">
                  <label className="font-semibold mb-2 block">
                    Edit Question Text:
                  </label>
                  <textarea
                    className="w-full p-2 border rounded min-h-[100px]"
                    value={editedQuestion.questionText}
                    onChange={handleQuestionTextChange}
                  />
                </div>
              </div>

              {/* Right Column: Live Math Preview (if applicable) */}
              {isEditingMath && (
                <div className="md:w-1/2 border-l pl-4">
                  <h3 className="font-semibold mb-2">Math Preview</h3>
                  <div className="bg-gray-50 p-3 rounded">
                    {renderTextWithMath(editedQuestion.questionText)}
                  </div>
                </div>
              )}
            </div>

            {/* Editable Options (for MCQs) */}
            {editedQuestion.options && editedQuestion.options.length > 0 && (
              <div>
                <strong>Options</strong>
                <ul className="list-disc ml-6 mt-2 space-y-3">
                  {editedQuestion.options.map((opt, idx) => (
                    <li key={idx} className="ml-3">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{opt.key}.</span>
                          <textarea
                            className="w-full p-2 border rounded min-h-[40px]"
                            value={opt.option || ""}
                            onChange={(e) =>
                              handleOptionChange(idx, e.target.value)
                            }
                          />
                        </div>
                        {/* If option text contains math, show a preview */}
                        {opt.option && opt.option.includes("$") && (
                          <div className="ml-8 bg-gray-50 p-2 rounded text-sm text-gray-700">
                            {renderTextWithMath(opt.option)}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionPaperEditPage;
