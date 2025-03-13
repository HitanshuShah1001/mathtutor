/**
 * QUESTION BANK COMPONENT WITH INFINITE SCROLL PAGINATION
 *
 * 1) API Response:
 *    {
 *      "success": true,
 *      "questions": [...],
 *      "hasNextPage": true,
 *      "nextCursor": "2025-03-12T22:20:57.076Z"
 *    }
 *
 * 2) We'll store and pass `cursor` in subsequent calls. The initial call will
 *    omit `cursor` or pass it as undefined, but once we get a `nextCursor`
 *    from the response, we use it to fetch more data.
 *
 * 3) Infinite Scroll Approach:
 *    - Listen to the window scroll event. Whenever the user nears the bottom,
 *      we request more data if `hasNextPage` is `true`.
 *    - Show a small loading indicator at the bottom while we fetch the next batch.
 *
 * 4) We'll handle:
 *    - A "master" `loading` boolean for the first data fetch or filter changes.
 *    - An `infiniteLoading` boolean specifically for loading more data.
 *    - A `cursor` state that updates with each response, and a `hasNextPage` state.
 *    - Reset logic when filters change (meaning we re-fetch from page 1).
 *
 * 5) Code is fully commented to illustrate how each piece fits together.
 */

import React, { useState, useEffect, useCallback } from "react";
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
export const modalContainerClass =
  "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
export const modalContentClass =
  "bg-white rounded-lg p-6 max-w-3xl w-full mx-4 h-[70vh] overflow-y-auto relative";

// Renders text with math expressions by replacing an invisible marker with "$"
const renderTextWithMath = (text) => {
  const MATH_MARKER = "\u200B";
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
  // State to store fetched questions
  const [questions, setQuestions] = useState([]);
  // Tracks which questions are selected for "Generate Paper" or "Delete"
  const [selected, setSelected] = useState({});
  // 'loading' covers the initial data load or when filters change
  const [loading, setLoading] = useState(false);
  // 'infiniteLoading' is specifically for fetching more data (pagination)
  const [infiniteLoading, setInfiniteLoading] = useState(false);
  // Filter states
  const [filters, setFilters] = useState({
    marks: "",
    type: "",
    difficulty: "",
  });
  // For searching within question text/options
  const [searchTerm, setSearchTerm] = useState("");
  // Pagination states
  const [cursor, setCursor] = useState(undefined);
  const [hasNextPage, setHasNextPage] = useState(true);

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

  // Sticky header state
  const [isScrolled, setIsScrolled] = useState(false);

  // Listen to window scroll for the sticky header style + infinite scroll

  const handleInfiniteScroll = useCallback(() => {
    // If no more data or we are already fetching new data, do nothing
    if (!hasNextPage || infiniteLoading || loading) return;

    // Check if user scrolled near bottom (e.g., 300 px threshold)
    const scrollThreshold = 300;
    const scrolledToBottom =
      window.innerHeight + window.scrollY >=
      document.body.offsetHeight - scrollThreshold;

    if (scrolledToBottom) {
      // fetch next page
      fetchQuestions(false);
    }
  }, [hasNextPage, infiniteLoading, loading, cursor]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
      handleInfiniteScroll();
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleInfiniteScroll]);

  // Whenever any filter changes, we reset the questions array, the cursor, etc.
  // Then fetch fresh data from page 1 (cursor=undefined).
  useEffect(() => {
    setQuestions([]);
    setCursor(undefined);
    setHasNextPage(true);
    setSelected({});
    fetchQuestions(true); // Force fresh load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  /**
   *  fetchQuestions
   *  -------------
   *  isInitialLoad = true means we are re-loading from scratch (e.g., after filter changes).
   *  If isInitialLoad = false, we are fetching the "next page" in infinite scroll scenario.
   */
  const fetchQuestions = async (isInitialLoad = false) => {
    // Decide which loading spinner to show
    console.log('fetching questions')
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setInfiniteLoading(true);
    }

    try {
      // Build query string. By default, limit=10
      const queryParams = new URLSearchParams({ limit: "100" });

      // The request body includes filters and possibly the cursor
      const payload = {
        ...(filters.marks && { marks: filters.marks }),
        ...(filters.type && { type: filters.type }),
        ...(filters.difficulty && {
          difficulty: filters.difficulty?.toLowerCase(),
        }),
        // If we have a cursor from the previous request, include it
        ...(cursor && { cursor }),
      };

      const response = await postRequest(
        `${BASE_URL_API}/question/getPaginatedQuestions?${queryParams.toString()}`,
        payload
      );

      console.log("API RESPONSE => ", response);

      // If this is the first load or filter change, override the questions array
      if (isInitialLoad) {
        setQuestions(response.questions || []);
      } else {
        // Otherwise, append new questions to the existing array
        setQuestions((prev) => [...prev, ...(response.questions || [])]);
      }

      // Update pagination states
      setHasNextPage(response.hasNextPage);
      setCursor(response.nextCursor);
    } catch (error) {
      console.error("Error fetching questions:", error);
    }

    // Reset the relevant loading states
    if (isInitialLoad) {
      setLoading(false);
    } else {
      setInfiniteLoading(false);
    }
  };

  /**
   * handleInfiniteScroll
   * --------------------
   *  Called on scroll. If the user is near the bottom and hasNextPage is true,
   *  we load the next page. We also check that we aren't already in the middle
   *  of an API call.
   */
  

  // Toggle selection of a question
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

  // MATH EDITING UTILS
  const MATH_MARKER = "\u200B";
  const handleMathKeyDown = (e, field, index = null) => {
    if (e.metaKey) {
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
      // Reset the newQuestion state
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
      // Refresh questions from scratch after upserting (in case we updated filters, etc.)
      setQuestions([]);
      setCursor(undefined);
      setHasNextPage(true);
      setSelected({});
      fetchQuestions(true); // Force re-fetch from beginning
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
      // Reset local states & refetch
      setQuestions([]);
      setCursor(undefined);
      setHasNextPage(true);
      setSelected({});
      fetchQuestions(true);
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

  // Filtered list if there's a search term
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
      {loading && questions.length === 0 ? (
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

          {/* Show "No more data" or a small loader for infinite scroll */}
          {hasNextPage ? (
            infiniteLoading && (
              <div className="text-center py-2 text-gray-500">
                Loading more questions...
              </div>
            )
          ) : (
            <div className="text-center py-4 text-gray-500">
              No more questions to load
            </div>
          )}
        </div>
      )}

      {/* ADD/EDIT QUESTION MODAL */}
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
