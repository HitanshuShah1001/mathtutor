import React, { useState, useEffect } from "react";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import { ACCESS_KEY, BASE_URL_API } from "../constants/constants";

import { postRequest } from "../utils/ApiCall";
import { uploadToS3 } from "../utils/s3utils"; // Import your upload function

const renderTextWithMath = (text) => {
  const MATH_MARKER = "\u200B";
  // Replace the invisible marker with "$" for parsing
  const processedText = text?.replace(new RegExp(MATH_MARKER, "g"), "$");
  const parts = processedText?.split("$");
  return parts?.map((part, index) =>
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

  // New state for showing the “Add/Edit Question” modal.
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  // New state to track if we are editing (true) or adding (false)
  const [isEditing, setIsEditing] = useState(false);
  // newQuestion state now includes an "imageUrl" for the question.
  const [newQuestion, setNewQuestion] = useState({
    type: "MCQ",
    questionText: "",
    imageUrl: "", // added for question image
    marks: "",
    difficulty: "",
    options: [
      { key: "A", optionText: "", imageUrl: "" },
      { key: "B", optionText: "", imageUrl: "" },
      { key: "C", optionText: "", imageUrl: "" },
      { key: "D", optionText: "", imageUrl: "" },
    ],
  });

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Set to opaque if scrolled down even a little.
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const accesskey = localStorage.getItem(ACCESS_KEY);

      // Prepare query parameters – the limit (and optionally a cursor) go in the URL.
      const queryParams = new URLSearchParams({
        limit: "10000",
      });

      // Prepare the body payload with filtering options.
      const payload = {
        ...(filters.marks && { marks: filters.marks }),
        ...(filters.type && { type: filters.type }),
        ...(filters.difficulty && {
          difficulty: filters.difficulty.toLowerCase(),
        }),
      };

      // Make the POST request using Axios.
      const response = await postRequest(
        `${BASE_URL_API}/question/getPaginatedQuestions?${queryParams.toString()}`,
        payload
      );

      console.log(response, "response");

      // Assuming the API returns the questions in response.data.questions
      setQuestions(response.questions);
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
  };

  // -------------------------------------------------------------------
  // HANDLING THE NEW QUESTION / EDIT FORM (Add / Upsert)
  // -------------------------------------------------------------------

  // For any text input, when the user presses shift + "$",
  // we insert a "$" at the current cursor position.
  const MATH_MARKER = "\u200B";

  const handleMathKeyDown = (e, field, index = null) => {
    if ((e.metaKey || e.shiftKey) && e.key === "$") {
      e.preventDefault();
      const input = e.target;
      const { selectionStart, selectionEnd, value } = input;
      const newValue =
        value.slice(0, selectionStart) +
        MATH_MARKER +
        value.slice(selectionEnd);
      if (field === "questionText") {
        setNewQuestion((prev) => ({ ...prev, questionText: newValue }));
      } else if (field === "option" && index !== null) {
        setNewQuestion((prev) => {
          const options = [...prev.options];
          options[index] = { ...options[index], optionText: newValue };
          return { ...prev, options };
        });
      }
    }
  };

  // Generic change handler for our new question form.
  const handleNewQuestionChange = (e, field, index = null) => {
    if (field === "questionText") {
      setNewQuestion((prev) => ({ ...prev, questionText: e.target.value }));
    } else if (
      field === "marks" ||
      field === "difficulty" ||
      field === "type"
    ) {
      setNewQuestion((prev) => ({ ...prev, [field]: e.target.value }));
    } else if (field === "option" && index !== null) {
      setNewQuestion((prev) => {
        const options = [...prev.options];
        options[index] = { ...options[index], optionText: e.target.value };
        return { ...prev, options };
      });
    }
  };

  // ----------------------------------------------------------
  // IMAGE UPLOAD HANDLERS (using the provided uploadToS3 function)
  // ----------------------------------------------------------

  // For question image
  const handleQuestionImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Create a target link using file name (you can customize this logic)
    const targetLink = `https://tutor-staffroom-files.s3.ap-south-1.amazonaws.com/${file.name}`;
    try {
      const fileUrl = await uploadToS3(file, targetLink);
      console.log(fileUrl, "file url uploaded to s3");
      setNewQuestion((prev) => ({ ...prev, imageUrl: fileUrl }));
    } catch (error) {
      console.error("Error uploading question image:", error);
    }
  };

  // For option image
  const handleOptionImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    const targetLink = `https://tutor-staffroom-files.s3.ap-south-1.amazonaws.com/${file.name}`;
    try {
      const fileUrl = await uploadToS3(file, targetLink);
      console.log(fileUrl, "file url that camer");
      setNewQuestion((prev) => {
        const options = [...prev.options];
        options[index] = { ...options[index], imageUrl: fileUrl };
        return { ...prev, options };
      });
    } catch (error) {
      console.error("Error uploading option image:", error);
    }
  };

  // Submit the new or edited question by calling the upsert API.
  const handleNewQuestionSubmit = async () => {
    try {
      const accesskey = localStorage.getItem(ACCESS_KEY);
      let payload = {
        ...newQuestion,
        difficulty: newQuestion.difficulty.toLowerCase(),
      };
      if (isEditing) {
        payload.id = newQuestion.id;
      }
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
      setShowAddQuestionModal(false);
      setIsEditing(false);
      // Reset the form state.
      setNewQuestion({
        type: "MCQ",
        questionText: "",
        imageUrl: "",
        marks: "",
        difficulty: "",
        options: [
          { key: "A", optionText: "", imageUrl: "" },
          { key: "B", optionText: "", imageUrl: "" },
          { key: "C", optionText: "", imageUrl: "" },
          { key: "D", optionText: "", imageUrl: "" },
        ],
      });
      // Refresh the question list.
      fetchQuestions();
      // Optionally, clear the selections.
      setSelected({});
    } catch (error) {
      console.error("Error upserting question:", error);
    }
  };

  // -------------------------------------------------------------------
  // DELETE SELECTED QUESTIONS
  // -------------------------------------------------------------------
  const handleDeleteQuestions = async () => {
    const selectedIds = Object.keys(selected).filter((id) => selected[id]);
    if (selectedIds.length === 0) {
      alert("Please select at least one question to delete.");
      return;
    }
    if (
      !window.confirm("Are you sure you want to delete the selected questions?")
    ) {
      return;
    }
    try {
      const accesskey = localStorage.getItem(ACCESS_KEY);
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`${BASE_URL_API}/question/delete`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: accesskey,
            },
            body: JSON.stringify({ id: id }),
          }).then((res) => res.json())
        )
      );
      fetchQuestions();
      setSelected({});
    } catch (error) {
      console.error("Error deleting questions:", error);
    }
  };

  // -------------------------------------------------------------------
  // EDIT QUESTION HANDLING
  // -------------------------------------------------------------------
  const handleEditQuestion = () => {
    const selectedIds = Object.keys(selected).filter((id) => selected[id]);
    if (selectedIds.length === 1) {
      const questionId = selectedIds[0];
      const questionToEdit = questions.find(
        (q) => q.id.toString() === questionId.toString()
      );
      if (questionToEdit) {
        setNewQuestion({
          id: questionToEdit.id,
          type: questionToEdit.type,
          questionText: questionToEdit.questionText,
          imageUrl: questionToEdit.imageUrl || "",
          marks: questionToEdit.marks,
          difficulty: questionToEdit.difficulty.toUpperCase(),
          options:
            questionToEdit.type === "MCQ"
              ? questionToEdit.options.map((opt) => ({
                  ...opt,
                  imageUrl: opt.imageUrl || "",
                }))
              : [
                  { key: "A", optionText: "", imageUrl: "" },
                  { key: "B", optionText: "", imageUrl: "" },
                  { key: "C", optionText: "", imageUrl: "" },
                  { key: "D", optionText: "", imageUrl: "" },
                ],
        });
        setIsEditing(true);
        setShowAddQuestionModal(true);
      }
    }
  };

  return (
    <div className="p-6 relative">
      <div
        className={`sticky top-0 bg-white p-1 transition-opacity duration-300 border rounded ${
          isScrolled ? "opacity-100" : "opacity-90"
        }`}
        style={{ zIndex: 50 }}
      >
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
            className="inline-flex items-center px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors duration-200"
          >
            Generate Question Paper
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setNewQuestion({
                type: "MCQ",
                questionText: "",
                imageUrl: "",
                marks: "",
                difficulty: "",
                options: [
                  { key: "A", optionText: "", imageUrl: "" },
                  { key: "B", optionText: "", imageUrl: "" },
                  { key: "C", optionText: "", imageUrl: "" },
                  { key: "D", optionText: "", imageUrl: "" },
                ],
              });
              setShowAddQuestionModal(true);
            }}
            className="inline-flex items-center px-3 py-2 bg-teal-500 text-white text-sm rounded-lg hover:bg-teal-600 transition-colors duration-200"
          >
            Add Question
          </button>
          {Object.keys(selected).filter((id) => selected[id]).length === 1 && (
            <button
              onClick={handleEditQuestion}
              className="inline-flex items-center px-3 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors duration-200"
            >
              Edit Question
            </button>
          )}
          {selected && Object.keys(selected).some((id) => selected[id]) && (
            <button
              onClick={handleDeleteQuestions}
              className="inline-flex items-center px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors duration-200"
            >
              Delete
            </button>
          )}
        </div>
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
                  {/* Display question image if available */}
                  {question?.imageUrl && (
                    <img
                      src={question.imageUrl}
                      alt="Question"
                      className="mb-2 rounded w-24 h-24 h-auto"
                    />
                  )}

                  {question.type === "MCQ" && (
                    <div className="ml-4 space-y-2" style={{ marginTop: 10 }}>
                      {question?.options?.map((option) => (
                        <div
                          key={option.key}
                          className="flex items-center gap-2 flex-col sm:flex-row"
                        >
                          <div className="flex items-center gap-2">
                            <div>
                              <span className="font-bold">{option.key}:</span>
                              {renderTextWithMath(option.optionText)}
                            </div>
                            <div>
                              {option.imageUrl && (
                                <img
                                  src={option.imageUrl}
                                  alt={`Option ${option.key}`}
                                  className="mt-1 rounded w-24 h-24"
                                />
                              )}
                            </div>
                          </div>
                          {/* Display option image if available */}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 text-sm text-gray-600">
                    Marks: {question.marks} | Type: {question.type} |
                    Difficulty: {question.difficulty}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddQuestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 h-[70vh] overflow-y-auto relative">
            {/* Modal Header */}
            <h3 className="text-lg font-semibold mb-4 top-0 bg-white z-10">
              {isEditing ? "Edit Question" : "Add New Question"}
            </h3>

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
                placeholder="Enter question text. Use Shift + $ to add math equations."
                rows="4"
              />
              <div className="mt-2 text-sm text-gray-500">
                Preview: {renderTextWithMath(newQuestion.questionText)}
              </div>
            </div>

            {/* Question Image Upload */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">
                Question Image (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleQuestionImageUpload}
              />
              {newQuestion.imageUrl && (
                <img
                  src={newQuestion.imageUrl}
                  alt="Question preview"
                  className="mt-2 rounded w-24 h-24 h-auto border"
                />
              )}
            </div>

            {/* Options (only for MCQ) */}
            {newQuestion.type === "MCQ" && (
              <div className="mb-4">
                <label className="block mb-1 font-medium">Options</label>
                {newQuestion.options.map((option, index) => (
                  <div key={option.key} className="mb-4 border p-2 rounded">
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
                      className="w-full border rounded p-2 mb-1"
                      placeholder={`Enter option ${option.key} text. Use Shift + $ for math.`}
                    />
                    <div className="mt-1 text-sm text-gray-500">
                      Preview: {renderTextWithMath(option.optionText)}
                    </div>
                    <div className="mt-2">
                      <label className="block text-sm font-medium">
                        Option {option.key} Image (optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleOptionImageUpload(e, index)}
                      />
                      {option.imageUrl && (
                        <img
                          src={option.imageUrl}
                          alt={`Option ${option.key} preview`}
                          className="mt-2 rounded w-24 h-24 border"
                        />
                      )}
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
            <div className="flex justify-end gap-4 bottom-0 bg-white p-4 z-10 ">
              <button
                onClick={() => {
                  setShowAddQuestionModal(false);
                  setIsEditing(false);
                  setNewQuestion({
                    type: "MCQ",
                    questionText: "",
                    imageUrl: "",
                    marks: "",
                    difficulty: "",
                    options: [
                      { key: "A", optionText: "", imageUrl: "" },
                      { key: "B", optionText: "", imageUrl: "" },
                      { key: "C", optionText: "", imageUrl: "" },
                      { key: "D", optionText: "", imageUrl: "" },
                    ],
                  });
                }}
                className="inline-flex items-center px-3 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleNewQuestionSubmit}
                className="inline-flex items-center px-3 py-2 bg-teal-500 text-white text-sm rounded-lg hover:bg-teal-600 transition-colors duration-200"
              >
                {isEditing ? "Update Question" : "Save Question"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
