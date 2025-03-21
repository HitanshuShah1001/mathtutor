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
  marksOptions,
  difficulties,
} from "../constants/constants";
import { postRequest, deleteRequest } from "../utils/ApiCall";
import { uploadToS3 } from "../utils/s3utils";
import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { primaryButtonClass } from "./DocumentList";

const inputClass =
  "w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:border-blue-500";
const blackButtonClass =
  "inline-flex items-center px-4 py-2 bg-black text-white font-semibold rounded-lg hover:bg-black transition-colors duration-200 mr-2";
export const headerClass =
  "fixed top-0 left-0 right-0 z-20 bg-white shadow-md h-20 flex items-center px-4";
const commonButtonClass =
  "px-4 py-2 bg-black text-white font-semibold rounded hover:bg-black transition-colors";

export const modalContainerClass =
  "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
export const modalContentClass =
  "bg-white rounded-lg p-6 max-w-3xl w-full mx-4 h-[70vh] overflow-y-auto relative";

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
      <div
        className="flex items-center justify-between cursor-pointer py-2 px-1"
        onClick={() => onToggleAccordion(filterKey)}
      >
        <h3 className="font-semibold text-base">{label}</h3>
        <span className="text-sm text-gray-600 select-none">
          {isOpen ? "▲" : "▼"}
        </span>
      </div>
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
                className={`px-3 py-1 rounded-full cursor-pointer transition-colors text-sm ${
                  isSelected
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
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
  const navigate = useNavigate();

  // Data and pagination states
  const [questions, setQuestions] = useState([]);
  const [cursor, setCursor] = useState(undefined);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [infiniteLoading, setInfiniteLoading] = useState(false);
  const [selected, setSelected] = useState({});

  // Filter state
  const [filters, setFilters] = useState({
    grade: [],
    subject: [],
    examDays: [],
    examMonths: [],
    examYears: [],
    shifts: [],
    streams: [],
    examNames: [],
    marks: [],
    types: [],
    difficulties: [],
    questionTypes: [],
  });
  const [searchQuery, setSearchQuery] = useState("");

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

  // Control filter panel visibility
  const [showFilterPanel, setShowFilterPanel] = useState(true);

  // Accordion state for each filter group
  const [openFilterGroups, setOpenFilterGroups] = useState({
    grade: false,
    subject: false,
    examDays: false,
    examMonths: false,
    examYears: false,
    shifts: false,
    streams: false,
    examNames: false,
    marks: false,
    types: false,
    difficulties: false,
    questionTypes: false,
  });

  // Create Question Paper Flow States
  const [showPaperDialog, setShowPaperDialog] = useState(false);
  const [showCustomCreateModal, setShowCustomCreateModal] = useState(false);
  const [customPaperName, setCustomPaperName] = useState("");
  const [customPaperGrade, setCustomPaperGrade] = useState("");
  const [customPaperSubject, setCustomPaperSubject] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const onToggleAccordion = (filterKey) => {
    setOpenFilterGroups((prev) => ({
      ...prev,
      [filterKey]: !prev[filterKey],
    }));
  };

  const toggleFilterValue = (filterKey, value) => {
    setFilters((prev) => {
      const existing = prev[filterKey];
      const newValues = existing.includes(value)
        ? existing.filter((v) => v !== value)
        : [...existing, value];
      return { ...prev, [filterKey]: newValues };
    });
  };

  const resetAllFilters = () => {
    setFilters({
      grade: [],
      subject: [],
      examDays: [],
      examMonths: [],
      examYears: [],
      shifts: [],
      streams: [],
      examNames: [],
      marks: [],
      types: [],
      difficulties: [],
      questionTypes: [],
    });
    setSearchQuery("");
  };

  // Infinite scroll
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
    window.addEventListener("scroll", handleInfiniteScroll);
    return () => window.removeEventListener("scroll", handleInfiniteScroll);
  }, [handleInfiniteScroll]);

  useEffect(() => {
    setQuestions([]);
    setCursor(undefined);
    setHasNextPage(true);
    fetchQuestions(true);
  }, [filters, searchQuery]);

  const fetchQuestions = async (isInitialLoad = false) => {
    isInitialLoad ? setLoading(true) : setInfiniteLoading(true);
    try {
      const queryParams = new URLSearchParams({
        limit: "10",
        ...(cursor && { cursor }),
      });
      const payload = {
        ...(filters.grade.length > 0 && { grades: filters.grade }),
        ...(filters.subject.length > 0 && { subjects: filters.subject }),
        ...(filters.examDays.length > 0 && { examDays: filters.examDays }),
        ...(filters.examMonths.length > 0 && {
          examMonths: filters.examMonths,
        }),
        ...(filters.examYears.length > 0 && { examYears: filters.examYears }),
        ...(filters.shifts.length > 0 && { shifts: filters.shifts }),
        ...(filters.streams.length > 0 && { streams: filters.streams }),
        ...(filters.examNames.length > 0 && { examNames: filters.examNames }),
        ...(filters.marks.length > 0 && { marks: filters.marks }),
        ...(filters.types.length > 0 && { types: filters.types }),
        ...(filters.difficulties.length > 0 && {
          difficulties: filters.difficulties.map((d) => d.toLowerCase()),
        }),
        ...(filters.questionTypes.length > 0 && {
          questionTypes: filters.questionTypes,
        }),
        name: searchQuery,
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
    } finally {
      isInitialLoad ? setLoading(false) : setInfiniteLoading(false);
    }
  };

  // Create Question Paper Flow Functions
  const handleCreatePaper = () => {
    setShowPaperDialog(true);
  };

  const handleCustomPaperClick = () => {
    setShowPaperDialog(false);
    setShowCustomCreateModal(true);
  };

  useEffect(() => {
    setSelected({});
  }, []);

  const handleConfirmCustomPaper = async () => {
    if (!customPaperName || !customPaperGrade || !customPaperSubject) {
      setErrorMessage("All three fields are required.");
      return;
    }
    setErrorMessage("");
    try {
      const body = {
        name: customPaperName,
        grade: Number(customPaperGrade),
        subject: customPaperSubject,
      };
      const url = `${BASE_URL_API}/questionPaper/create`;
      const response = await postRequest(url, body);
      if (response.id) {
        navigate("/custom-question-paper-generation", {
          state: { questionPaperId: response.id },
        });
      } else {
        setErrorMessage(response?.message || "Failed to create paper.");
      }
      setShowCustomCreateModal(false);
      setCustomPaperName("");
      setCustomPaperGrade("");
      setCustomPaperSubject("");
    } catch (error) {
      console.error("Error creating custom paper:", error);
      setErrorMessage("Something went wrong while creating the paper.");
    }
  };

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
      setQuestions([]);
      setSelected({});
      setCursor(undefined);
      setHasNextPage(true);
      fetchQuestions(true);
    } catch (error) {
      console.error("Error upserting question:", error);
    }
  };

  const toggleSelection = (questionId) => {
    setSelected((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
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

  // Updated EditQuestionWrapper: only returns the button when exactly one question is selected.
  const EditQuestionWrapper = () => {
    const selectedCount = Object.keys(selected).filter(
      (id) => selected[id]
    ).length;
    return selectedCount === 1 ? (
      <button onClick={handleEditQuestion} className={blackButtonClass}>
        Edit Question
      </button>
    ) : null;
  };

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: "white" }}>
      <header className={headerClass}>
        <h2 className="text-2xl font-semibold text-gray-800">Questions</h2>
        <div className="ml-auto">
          <button
            onClick={() => navigate("/question-paper-list")}
            className={`inline-flex items-center ${primaryButtonClass} mr-4`}
          >
            <FileText className="w-4 h-4 mr-2" />
            Question Papers
          </button>
          <button
            onClick={handleCreatePaper}
            className={`inline-flex items-center ${primaryButtonClass}`}
          >
            <FileText className="w-4 h-4 mr-2" />
            Create Question Paper
          </button>
        </div>
      </header>

      <div className="flex pt-20">
        {showFilterPanel && (
          <aside className="fixed top-20 left-0 w-64 h-[calc(100vh-80px)] border-r px-4 py-2 overflow-y-auto bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Filters</h2>
            </div>
            
            <div className="mb-4">
              {Object.entries(filters).map(([key, values]) =>
                values.map((val) => (
                  <span
                    key={`${key}-${val}`}
                    className="inline-flex items-center px-3 py-1 mr-2 mb-2 bg-blue-600 text-white rounded-full text-sm"
                  >
                    {val}
                    <button
                      onClick={() => toggleFilterValue(key, val)}
                      className="ml-1 text-white"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
              {[
                { label: "Grade", key: "grade", values: grades },
                { label: "Subject", key: "subject", values: subjects },
                { label: "Exam Day", key: "examDays", values: examDays },
                { label: "Exam Month", key: "examMonths", values: examMonths },
                { label: "Exam Year", key: "examYears", values: examYears },
                { label: "Shift", key: "shifts", values: shifts },
                { label: "Stream", key: "streams", values: streams },
                { label: "Exam Name", key: "examNames", values: examNames },
                { label: "Marks", key: "marks", values: marksOptions },
                {
                  label: "Difficulty",
                  key: "difficulties",
                  values: difficulties,
                },
                {
                  label: "Question Type",
                  key: "questionTypes",
                  values: questionTypes,
                },
              ].map(({ label, key, values }) => (
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
            <button
              onClick={resetAllFilters}
              className={`${blackButtonClass} w-full mt-4`}
            >
              Reset Filters
            </button>
          </aside>
        )}

        <main
          className={`flex-1 overflow-y-auto p-4 ${
            showFilterPanel ? "ml-64" : ""
          }`}
        >
          <div
            className="mb-4"
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="px-3 py-2 border rounded"
            >
              {showFilterPanel ? "Hide Filters" : "Show Filters"}
            </button>
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
              <EditQuestionWrapper />
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
          {loading && questions.length === 0 ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="ml-4 text-gray-600">Loading questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No questions found. Adjust your filters or add a new question.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className="flex justify-between p-4 border border-gray-200 rounded-lg shadow-sm"
                >
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
                            className="flex items-center gap-2"
                          >
                            <span className="font-bold">{option.key}:</span>
                            {renderTextWithMath(option.option)}
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
              ))}
              {hasNextPage ? (
                infiniteLoading && (
                  <div className="text-center py-4 text-gray-500">
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
        </main>
      </div>

      {showAddQuestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 h-[70vh] overflow-y-auto relative">
            <h3 className="text-lg font-semibold mb-4">
              {isEditing ? "Edit Question" : "Add New Question"}
            </h3>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Question Type</label>
              <select
                value={newQuestion.type}
                onChange={(e) => handleNewQuestionChange(e, "type")}
                className={inputClass}
              >
                {questionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
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

      {showPaperDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div
            className="bg-white text-black w-[300px] p-6 rounded relative flex flex-col items-center border border-gray-200 shadow-md"
            style={{ width: "30vw" }}
          >
            <button
              onClick={() => setShowPaperDialog(false)}
              className="absolute top-2 right-2 text-black font-bold"
            >
              X
            </button>
            <h2 className="mb-4 font-semibold text-lg">
              Create Question Paper
            </h2>
            <p className="mb-6 text-center">
              Choose the type of question paper you want to create:
            </p>
            <div className="flex flex-row gap-4 w-full justify-end">
              <button
                className={commonButtonClass}
                onClick={() => {
                  navigate("/question-paper-generation");
                  setShowPaperDialog(false);
                }}
              >
                AI-generated
              </button>
              <button
                className={commonButtonClass}
                onClick={handleCustomPaperClick}
              >
                Custom Paper
              </button>
            </div>
          </div>
        </div>
      )}

      {showCustomCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white border border-gray-200 shadow-lg rounded-lg w-[400px] p-6 relative">
            <button
              onClick={() => {
                setShowCustomCreateModal(false);
                setErrorMessage("");
              }}
              className="absolute top-2 right-2 text-black font-bold"
            >
              X
            </button>
            <h2 className="text-black text-lg font-semibold mb-4">
              Create Custom Paper
            </h2>
            <div className="flex flex-col gap-3">
              {errorMessage && (
                <p className="text-red-600 text-sm">{errorMessage}</p>
              )}
              <div>
                <label className="block text-black mb-1 font-medium">
                  Paper Name
                </label>
                <input
                  type="text"
                  value={customPaperName}
                  onChange={(e) => setCustomPaperName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Enter paper name"
                />
              </div>
              <div>
                <label className="block text-black mb-1 font-medium">
                  Grade
                </label>
                <select
                  value={customPaperGrade}
                  onChange={(e) => setCustomPaperGrade(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="">-- Select Grade --</option>
                  {grades.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-black mb-1 font-medium">
                  Subject
                </label>
                <select
                  value={customPaperSubject}
                  onChange={(e) => setCustomPaperSubject(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  className={commonButtonClass}
                  onClick={handleConfirmCustomPaper}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
