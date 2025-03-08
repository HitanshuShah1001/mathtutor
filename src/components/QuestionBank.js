import React, { useState, useEffect } from "react";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import { ACCESS_KEY, BASE_URL_API } from "../constants/constants";
import { postRequest, deleteRequest } from "../utils/ApiCall";
import { uploadToS3 } from "../utils/s3utils";

const marksOptions = Array.from({ length: 10 }, (_, i) => i + 1);
const types = ["MCQ", "Descriptive"];
const difficulties = ["EASY", "MEDIUM", "HARD"];

// Extracted styling constants
const inputClass =
  "w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500";
const selectClass = inputClass;
// New button style: black background, white text, semibold font
const blackButtonClass =
  "inline-flex items-center px-4 py-2 bg-[#000] text-white font-semibold rounded-lg hover:bg-[#000] transition-colors duration-200";
const headerClass =
  "sticky top-0 bg-white p-2 transition-opacity duration-300 border rounded z-50";
const modalContainerClass =
  "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
const modalContentClass =
  "bg-white rounded-lg p-6 max-w-3xl w-full mx-4 h-[70vh] overflow-y-auto relative";

// Renders text with math expressions by replacing an invisible marker with "$"
const renderTextWithMath = (text) => {
  const MATH_MARKER = "\u200B";
  // const processedText = text?.replace(new RegExp(MATH_MARKER, "g"), "$");
  const parts = text?.split("$");
  return parts?.map((part, index) =>
    index % 2 === 1 ? (
      <InlineMath key={index} math={part} />
    ) : (
      <span key={index} className="ml-3">
        {part}
      </span>
    )
  );
};

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    marks: "",
    type: "",
    difficulty: "",
  });
  const [searchTerm, setSearchTerm] = useState("");

  // Modal & form states for Add/Edit Question
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    type: "MCQ",
    questionText: "",
    imageUrl: "",
    marks: "",
    difficulty: "",
    options: [
      { key: "A", option: "", imageUrl: "" },
      { key: "B", option: "", imageUrl: "" },
      { key: "C", option: "", imageUrl: "" },
      { key: "D", option: "", imageUrl: "" },
    ],
  });

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
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
      const queryParams = new URLSearchParams({ limit: "10000" });
      const payload = {
        ...(filters.marks && { marks: filters.marks }),
        ...(filters.type && { type: filters.type }),
        ...(filters.difficulty && {
          difficulty: filters.difficulty?.toLowerCase(),
        }),
      };
      const response = await postRequest(
        `${BASE_URL_API}/question/getPaginatedQuestions?${queryParams.toString()}`,
        payload
      );
      console.log(response, "response");
      setQuestions(response.questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
    }
    setLoading(false);
  };

  const toggleSelection = (questionId) => {
    setSelected((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
  };

  const handleGenerateQuestionPaper = () => {
    const selectedQuestions = questions.filter((q) => selected[q.id]);
    console.log("Selected questions:", selectedQuestions);
  };

  // HANDLING MATH IN QUESTION TEXT & OPTIONS
  const MATH_MARKER = "\u200B";
  const handleMathKeyDown = (e, field, index = null) => {
    if ((e.metaKey)) {
      e.preventDefault();
      const { selectionStart, selectionEnd, value } = e.target;
      const newValue =
        value.slice(0, selectionStart) +
        MATH_MARKER +
        value.slice(selectionEnd);
      if (field === "questionText") {
        setNewQuestion((prev) => ({ ...prev, questionText: newValue }));
      } else if (field === "option" && index !== null) {
        setNewQuestion((prev) => {
          const options = [...prev.options];
          options[index] = { ...options[index], option: newValue };
          return { ...prev, options };
        });
      }
    }
  };

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
        options[index] = { ...options[index], option: e.target.value };
        return { ...prev, options };
      });
    }
  };

  // IMAGE UPLOAD HANDLERS
  const handleQuestionImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const targetLink = `https://tutor-staffroom-files.s3.ap-south-1.amazonaws.com/${file.name}`;
    try {
      const fileUrl = await uploadToS3(file, targetLink);
      console.log(fileUrl, "file url uploaded to s3");
      setNewQuestion((prev) => ({ ...prev, imageUrl: fileUrl }));
    } catch (error) {
      console.error("Error uploading question image:", error);
    }
  };

  const handleOptionImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    const targetLink = `https://tutor-staffroom-files.s3.ap-south-1.amazonaws.com/${file.name}`;
    try {
      const fileUrl = await uploadToS3(file, targetLink);
      console.log(fileUrl, "file url uploaded for option");
      setNewQuestion((prev) => {
        const options = [...prev.options];
        options[index] = { ...options[index], imageUrl: fileUrl };
        return { ...prev, options };
      });
    } catch (error) {
      console.error("Error uploading option image:", error);
    }
  };

  const handleNewQuestionSubmit = async () => {
    try {
      let payload = {
        ...newQuestion,
        difficulty: newQuestion.difficulty?.toLowerCase(),
      };
      if (isEditing) {
        payload.id = newQuestion.id;
      }
      if (newQuestion.type !== "MCQ") {
        delete payload.options;
      }
      const response = await postRequest(
        `${BASE_URL_API}/question/upsert`,
        payload
      );
      console.log("Question upserted:", response);
      setShowAddQuestionModal(false);
      setIsEditing(false);
      setNewQuestion({
        type: "MCQ",
        questionText: "",
        imageUrl: "",
        marks: "",
        difficulty: "",
        options: [
          { key: "A", option: "", imageUrl: "" },
          { key: "B", option: "", imageUrl: "" },
          { key: "C", option: "", imageUrl: "" },
          { key: "D", option: "", imageUrl: "" },
        ],
      });
      fetchQuestions();
      setSelected({});
    } catch (error) {
      console.error("Error upserting question:", error);
    }
  };

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
      await Promise.all(
        selectedIds.map((id) =>
          deleteRequest(`${BASE_URL_API}/question/delete`, { id })
        )
      );
      fetchQuestions();
      setSelected({});
    } catch (error) {
      console.error("Error deleting questions:", error);
    }
  };

  const handleEditQuestion = () => {
    const selectedIds = Object.keys(selected).filter((id) => selected[id]);
    if (selectedIds.length === 1) {
      const questionId = selectedIds[0];
      const questionToEdit = questions.find(
        (q) => q.id.toString() === questionId.toString()
      );
      console.log(questionToEdit, "question to edit");
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
                  { key: "A", option: "", imageUrl: "" },
                  { key: "B", option: "", imageUrl: "" },
                  { key: "C", option: "", imageUrl: "" },
                  { key: "D", option: "", imageUrl: "" },
                ],
        });
        setIsEditing(true);
        setShowAddQuestionModal(true);
      }
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (!searchTerm.trim()) return true;
    const lowerSearch = searchTerm?.toLowerCase();
    const textMatch =
      (q.questionText && q.questionText?.toLowerCase().includes(lowerSearch)) ||
      (q.type && q.type?.toLowerCase().includes(lowerSearch));
    const optionMatch =
      q.options &&
      q.options.some(
        (opt) => opt.option && opt.option?.toLowerCase().includes(lowerSearch)
      );
    return textMatch || optionMatch;
  });

  return (
    <div className="p-6 relative">
      {/* Sticky Header */}
      <div className={headerClass}>
        {/* Search Bar */}
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by type, question text or option"
            className={inputClass}
          />
        </div>

        {/* Filter Section */}
        <div className="flex gap-4 mb-6">
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">Marks</label>
            <select
              value={filters.marks}
              onChange={(e) => handleFilterChange("marks", e.target.value)}
              className={selectClass}
            >
              <option value="">All</option>
              {marksOptions.map((mark) => (
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
              className={selectClass}
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
              className={selectClass}
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

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={handleGenerateQuestionPaper}
            className={blackButtonClass}
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
                  { key: "A", option: "", imageUrl: "" },
                  { key: "B", option: "", imageUrl: "" },
                  { key: "C", option: "", imageUrl: "" },
                  { key: "D", option: "", imageUrl: "" },
                ],
              });
              setShowAddQuestionModal(true);
            }}
            className={blackButtonClass}
          >
            Add Question
          </button>
          {Object.keys(selected).filter((id) => selected[id]).length === 1 && (
            <button onClick={handleEditQuestion} className={blackButtonClass}>
              Edit Question
            </button>
          )}
          {selected && Object.keys(selected).some((id) => selected[id]) && (
            <button
              onClick={handleDeleteQuestions}
              className={blackButtonClass}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="text-center py-4">Loading questions...</div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((question) => (
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
                  {question.imageUrl && (
                    <img
                      src={question.imageUrl}
                      alt="Question"
                      className="mb-2 rounded w-24 h-24"
                    />
                  )}
                  {question.type === "MCQ" && (
                    <div className="ml-4 space-y-2 mt-2">
                      {question.options &&
                        question.options.map((option) => (
                          <div
                            key={option.key}
                            className="flex flex-col sm:flex-row items-center gap-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{option.key}:</span>
                              {renderTextWithMath(option.option)}
                            </div>
                            {option.imageUrl && (
                              <img
                                src={option.imageUrl}
                                alt={`Option ${option.key}`}
                                className="rounded w-24 h-24"
                              />
                            )}
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
        <div className={modalContainerClass}>
          <div className={modalContentClass}>
            <h3 className="text-lg font-semibold mb-4">
              {isEditing ? "Edit Question" : "Add New Question"}
            </h3>

            {/* Question Type */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">Question Type</label>
              <select
                value={newQuestion.type}
                onChange={(e) => handleNewQuestionChange(e, "type")}
                className={selectClass}
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
                className={inputClass}
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
                className="block"
              />
              {newQuestion.imageUrl && (
                <img
                  src={newQuestion.imageUrl}
                  alt="Question preview"
                  className="mt-2 rounded w-24 h-24 border"
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
                      value={option.option}
                      onChange={(e) =>
                        handleNewQuestionChange(e, "option", index)
                      }
                      onKeyDown={(e) => handleMathKeyDown(e, "option", index)}
                      className={`${inputClass} mb-1`}
                      placeholder={`Enter option ${option.key} text. Use Shift + $ for math.`}
                    />
                    <div className="mt-1 text-sm text-gray-500">
                      Preview: {renderTextWithMath(option.option)}
                    </div>
                    <div className="mt-2">
                      <label className="block text-sm font-medium">
                        Option {option.key} Image (optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleOptionImageUpload(e, index)}
                        className="block"
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
                  className={selectClass}
                >
                  <option value="">Select Marks</option>
                  {marksOptions.map((mark) => (
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
                  className={selectClass}
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
            <div className="flex justify-end gap-4 bg-white p-4">
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
                      { key: "A", option: "", imageUrl: "" },
                      { key: "B", option: "", imageUrl: "" },
                      { key: "C", option: "", imageUrl: "" },
                      { key: "D", option: "", imageUrl: "" },
                    ],
                  });
                }}
                className={blackButtonClass}
              >
                Cancel
              </button>
              <button
                onClick={handleNewQuestionSubmit}
                className={blackButtonClass}
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
