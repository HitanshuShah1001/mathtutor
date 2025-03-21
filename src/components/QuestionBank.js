/**
 * QUESTION BANK COMPONENT WITH INFINITE SCROLL PAGINATION
 */

import React, { useState, useEffect, useCallback } from "react";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import {
  BASE_URL_API,
  examDays,
  examMonths,
  examNames,
  examYears,
  grades,
  questionTypes,
  shifts,
  streams,
  subjects,
} from "../constants/constants";
import { postRequest, deleteRequest } from "../utils/ApiCall";
import { uploadToS3 } from "../utils/s3utils";

const marksOptions = Array.from({ length: 10 }, (_, i) => i + 1);
const types = ["archive", "custom", "autoGenerated"];
const difficulties = ["EASY", "MEDIUM", "HARD"];

// Extracted styling constants
const inputClass =
  "w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500";
const blackButtonClass =
  "inline-flex items-center px-4 py-2 bg-[#000] text-white font-semibold rounded-lg hover:bg-[#000] transition-colors duration-200";
const headerClass =
  "sticky top-0 bg-white p-2 border-b shadow-sm z-50 flex items-center justify-between";

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
      <span key={index}>{part}</span>
    )
  );
};

/**
 * Accordion-like component for each filter group.
 * Users click the header to expand/collapse the filter values,
 * which are shown as "chips" they can toggle on/off.
 */
const FilterGroupAccordion = ({
  label,
  filterKey,
  values,
  isOpen,
  onToggleAccordion,
  selectedValues,
  toggleFilterValue,
}) => {
  return (
    <div className="border-b mb-2">
      {/* Header: clickable area to expand/collapse */}
      <div
        className="flex items-center justify-between cursor-pointer py-2 px-1"
        onClick={() => onToggleAccordion(filterKey)}
      >
        <h3 className="font-semibold text-base">{label}</h3>
        <span className="text-sm text-gray-600 select-none">
          {isOpen ? "▲" : "▼"}
        </span>
      </div>
      {/* Body: Only visible if isOpen is true */}
      {isOpen && (
        <div className="flex flex-wrap gap-2 pb-3 pt-1 px-1">
          {values.map((val) => {
            const isSelected = selectedValues.includes(val);
            return (
              <span
                key={val}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFilterValue(filterKey, val);
                }}
                className={`px-3 py-1 rounded-full cursor-pointer transition-colors text-sm 
                  ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }
                `}
              >
                {val}
              </span>
            );
          })}
        </div>
      )}
    </div>
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

  /**
   * Filters are arrays to allow multiple selection.
   */
  const [filters, setFilters] = useState({
    marks: [],
    types: [],
    difficulties: [],
    grades: [],
    subjects: [],
    examDays: [],
    examMonths: [],
    examYears: [],
    shifts: [],
    streams: [],
    examNames: [],
    questionTypes: [],
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

  // State to control showing/hiding the entire left filter panel (mobile)
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  /**
   * This object tracks which filter group’s accordion is open/closed.
   * By default, everything is collapsed (false).
   */
  const [openFilterGroups, setOpenFilterGroups] = useState({
    marks: false,
    type: false,
    difficulty: false,
    grades: false,
    subjects: false,
    examDays: false,
    examMonths: false,
    examYears: false,
    shifts: false,
    streams: false,
    examNames: false,
    questionTypes: false,
  });

  // Toggle the accordion for a specific filter group
  const onToggleAccordion = (filterKey) => {
    setOpenFilterGroups((prev) => ({
      ...prev,
      [filterKey]: !prev[filterKey],
    }));
  };

  // Listen to window scroll for infinite scroll
  const handleInfiniteScroll = useCallback(() => {
    if (!hasNextPage || infiniteLoading || loading) return;
    const scrollThreshold = 300;
    const scrolledToBottom =
      window.innerHeight + window.scrollY >=
      document.body.offsetHeight - scrollThreshold;

    if (scrolledToBottom) {
      fetchQuestions(false);
    }
  }, [hasNextPage, infiniteLoading, loading, cursor]);

  useEffect(() => {
    const handleScroll = () => handleInfiniteScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleInfiniteScroll]);

  // Whenever any filter changes, reset and fetch fresh data
  useEffect(() => {
    setQuestions([]);
    setCursor(undefined);
    setHasNextPage(true);
    setSelected({});
    fetchQuestions(true);
    console.log("in here");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  /**
   *  fetchQuestions
   *  -------------
   *  isInitialLoad = true means we are re-loading from scratch (e.g., after filter changes).
   *  If isInitialLoad = false, we are fetching the "next page" in infinite scroll scenario.
   */
  const fetchQuestions = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setInfiniteLoading(true);
    }

    try {
      // We'll send `limit=10` in query params (or bigger if you want).
      const queryParams = new URLSearchParams({
        limit: "10",
        ...(cursor && { cursor }),
      });

      // Build the request body from multi-select filters
      const payload = {
        ...(filters.marks.length > 0 && { marks: filters.marks }),
        ...(filters.types.length > 0 && { types: filters.types }),
        ...(filters.difficulties.length > 0 && {
          difficulties: filters.difficulties.map((d) => d.toLowerCase()),
        }),
        ...(filters.grades.length > 0 && { grades: filters.grades }),
        ...(filters.subjects.length > 0 && { subjects: filters.subjects }),
        ...(filters.examDays.length > 0 && { examDays: filters.examDays }),
        ...(filters.examMonths.length > 0 && {
          examMonths: filters.examMonths,
        }),
        ...(filters.examYears.length > 0 && { examYears: filters.examYears }),
        ...(filters.shifts.length > 0 && { shifts: filters.shifts }),
        ...(filters.streams.length > 0 && { streams: filters.streams }),
        ...(filters.examNames.length > 0 && { examNames: filters.examNames }),
        ...(filters.questionTypes.length > 0 && {
          questionTypes: filters.questionTypes,
        }),
      };

      const response = await postRequest(
        `${BASE_URL_API}/question/getPaginatedQuestions?${queryParams.toString()}`,
        payload
      );

      if (isInitialLoad) {
        setQuestions(response.questions || []);
      } else {
        setQuestions((prev) => [...prev, ...(response.questions || [])]);
      }

      setHasNextPage(response.hasNextPage);
      setCursor(response.nextCursor);
    } catch (error) {
      console.error("Error fetching questions:", error);
    }

    if (isInitialLoad) {
      setLoading(false);
    } else {
      setInfiniteLoading(false);
    }
  };

  // Toggle selection of a question
  const toggleSelection = (questionId) => {
    setSelected((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
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
      // Refresh questions
      setQuestions([]);
      setCursor(undefined);
      setHasNextPage(true);
      setSelected({});
      fetchQuestions(true);
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

  const handleGenerateQuestionPaper = () => {
    const selectedQuestions = questions.filter((q) => selected[q.id]);
    console.log("Selected questions:", selectedQuestions);
    // your logic here
  };

  /**
   * Toggle a single value in a multi-select filter. If it exists, remove it; otherwise add it.
   */
  const toggleFilterValue = (filterKey, value) => {
    console.log(filterKey, value);
    setFilters((prev) => {
      const existingValues = prev[filterKey];
      console.log(filterKey, value, existingValues);
      let newValues;
      if (existingValues.includes(value)) {
        newValues = existingValues.filter((v) => v !== value);
      } else {
        newValues = [...existingValues, value];
      }
      return { ...prev, [filterKey]: newValues };
    });
  };

  // Filter results by searchTerm
  const filteredQuestions = questions.filter((q) => {
    if (!searchTerm.trim()) return true;
    const lowerSearch = searchTerm.toLowerCase();
    const textMatch =
      q.questionText?.toLowerCase().includes(lowerSearch) ||
      q.type?.toLowerCase().includes(lowerSearch);
    const optionMatch =
      q.options &&
      q.options.some((opt) => opt.option?.toLowerCase().includes(lowerSearch));
    return textMatch || optionMatch;
  });

  /**
   * One-stop data structure to iterate through each filter group,
   * its label, its associated key, and the list of possible values.
   * This makes it easier to map over them for the accordion.
   */
  const filterGroups = [
    { label: "Marks", key: "marks", values: marksOptions },
    { label: "Question Type", key: "questionTypes", values: questionTypes },
    { label: "Difficulty", key: "difficulties", values: difficulties },
    { label: "Grades", key: "grades", values: grades },
    { label: "Subjects", key: "subjects", values: subjects },
    { label: "Exam Days", key: "examDays", values: examDays },
    { label: "Exam Months", key: "examMonths", values: examMonths },
    { label: "Exam Years", key: "examYears", values: examYears },
    { label: "Shifts", key: "shifts", values: shifts },
    { label: "Streams", key: "streams", values: streams },
    { label: "Exam Names", key: "examNames", values: examNames },
    { label: "Types", key: "types", values: types },
  ];

  const resetAllFilters = () => {
    setFilters({
      marks: [],
      types: [],
      difficulties: [],
      grades: [],
      subjects: [],
      examDays: [],
      examMonths: [],
      examYears: [],
      shifts: [],
      streams: [],
      examNames: [],
      questionTypes: [],
    });
  };

  return (
    <div
      className="relative min-h-screen flex"
      style={{ backgroundColor: "white" }}
    >
      {/* Collapsible Filter Panel */}
      <div
        className={`fixed md:static top-0 left-0 min-h-screen w-64 bg-gray-100 border-r overflow-auto transform transition-transform duration-300 z-40 ${
          showFilterPanel
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
        style={{ backgroundColor: "white" }}
      >
        {/* Close button for mobile */}
        <div className="md:hidden flex justify-end p-2 border-b">
          <button
            onClick={() => setShowFilterPanel(false)}
            className="text-gray-600"
          >
            Close
          </button>
        </div>

        <div className="p-4" style={{ backgroundColor: "white" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 className="font-bold text-lg mb-4">Filters</h2>
            {/* Reset All Filters */}
            <div className="mb-6">
              <button
                className={`${blackButtonClass} px-3 py-2`}
                onClick={resetAllFilters}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Render each filter group in an accordion */}
          {filterGroups.map(({ label, key, values }) => (
            <FilterGroupAccordion
              key={key}
              label={label}
              filterKey={key}
              values={values}
              isOpen={openFilterGroups[key]}
              onToggleAccordion={onToggleAccordion}
              selectedValues={filters[key]}
              toggleFilterValue={toggleFilterValue}
            />
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 ml-0">
        {/* Sticky Header with search and actions */}
        <div className={headerClass}>
          {/* Left side: Toggle Filters button (mobile) and Search Bar */}
          <div className="flex items-center gap-2 flex-1 mr-3">
            

            {/* Make the input grow with flex-1 */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className={`${inputClass} flex-1`}
            />
          </div>

          {/* Right side: Action Buttons */}
          <div className="flex gap-2">
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

            {Object.keys(selected).filter((id) => selected[id]).length ===
              1 && (
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
        <div className="p-4">
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
                      {question.type === "MCQ" && question.options && (
                        <div className="ml-4 space-y-2 mt-2">
                          {question.options.map((option) => (
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

              {/* Show "No more data" or loader for infinite scroll */}
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
        </div>
      </div>

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
                className={inputClass}
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
                placeholder="Enter question text. Use SHIFT + $ for math."
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
                      placeholder={`Enter option ${option.key} text. Use SHIFT + $ for math.`}
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
                  className={inputClass}
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
                  className={inputClass}
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
