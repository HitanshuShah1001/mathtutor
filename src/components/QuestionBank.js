import React, { useState, useEffect, useCallback, useRef } from "react";
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
import ProfileMenu from "../subcomponents/ProfileMenu";

// Styling constants
const inputClass =
  "w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:border-blue-500";
const blackButtonClass =
  "inline-flex items-center px-4 py-2 bg-black text-white font-semibold rounded-lg hover:bg-black transition-colors duration-200 mr-2";
const primaryButtonClass =
  "inline-flex items-center px-4 py-2 bg-[#323232] text-white font-semibold rounded-lg hover:bg-black transition-colors duration-200 mr-2";
export const headerClass =
  "fixed top-0 left-0 right-0 z-20 bg-white shadow-md h-20 flex items-center px-4";
const commonButtonClass =
  "px-4 py-2 bg-black text-white font-semibold rounded hover:bg-black transition-colors";
export const modalContainerClass =
  "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
export const modalContentClass =
  "bg-white rounded-lg p-6 max-w-3xl w-full mx-4 h-[70vh] overflow-y-auto relative";

// Add your subject options here
const subjectOptions = [
  "maths",
  "science",
  "ss",
  "english",
  "grammar",
  "evs",
  "accounts",
  "economics",
  "spcc",
  "bo",
  "statistics",
];

// Helper function to render text with inline math
const renderTextWithMath = (text) => {
  const parts = text?.split("$");
  return parts?.map((part, index) =>
    index % 2 === 1 ? (
      <InlineMath key={index} math={part} />
    ) : (
      <span key={index}>{part}</span>
    )
  );
};

// Accordion for filtering
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

  // For selecting multiple questions to edit or delete
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

  // Show/hide filter panel
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

  // Infinite scroll references
  const questionRef = useRef(null);

  // Modal & form states for Add/Edit Question
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // The question structure, including new fields: subject, chapter, grade
  const [newQuestion, setNewQuestion] = useState({
    subject: "",
    chapter: "",
    grade: "",
    type: "MCQ",
    questionText: "",
    imageUrls: [],
    marks: "",
    difficulty: "",
    options: [
      { key: "A", option: "", imageUrl: "" },
      { key: "B", option: "", imageUrl: "" },
      { key: "C", option: "", imageUrl: "" },
      { key: "D", option: "", imageUrl: "" },
    ],
  });

  // Create Paper flow
  const [showPaperDialog, setShowPaperDialog] = useState(false);
  const [showCustomCreateModal, setShowCustomCreateModal] = useState(false);
  const [customPaperName, setCustomPaperName] = useState("");
  const [customPaperGrade, setCustomPaperGrade] = useState("");
  const [customPaperSubject, setCustomPaperSubject] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  /**
   * Toggles a filter group accordion.
   */
  const onToggleAccordion = (filterKey) => {
    setOpenFilterGroups((prev) => ({
      ...prev,
      [filterKey]: !prev[filterKey],
    }));
  };

  /**
   * Toggles a specific filter value within a filterKey array.
   */
  const toggleFilterValue = (filterKey, value) => {
    setFilters((prev) => {
      const existing = prev[filterKey];
      const newValues = existing.includes(value)
        ? existing.filter((v) => v !== value)
        : [...existing, value];
      return { ...prev, [filterKey]: newValues };
    });
  };

  /**
   * Resets all filters and search.
   */
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

  // Check if we need to load more documents (infinite scroll)
  const checkIfMoreDocumentsNeeded = useCallback(() => {
    if (!hasNextPage || infiniteLoading || loading) return;
    if (questionRef.current) {
      const documentListHeight = questionRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      const headerHeight = 80; // 80px for the header
      if (
        documentListHeight < viewportHeight - headerHeight - 10 &&
        hasNextPage
      ) {
        fetchQuestions(false);
      }
    }
  }, [hasNextPage, infiniteLoading, loading]);

  // Load more on scroll
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
    checkIfMoreDocumentsNeeded();
    window.addEventListener("resize", checkIfMoreDocumentsNeeded);
    return () =>
      window.removeEventListener("resize", checkIfMoreDocumentsNeeded);
  }, [questions, checkIfMoreDocumentsNeeded]);

  useEffect(() => {
    window.addEventListener("scroll", handleInfiniteScroll);
    return () => window.removeEventListener("scroll", handleInfiniteScroll);
  }, [handleInfiniteScroll]);

  /**
   * On filter or search change, reset list and fetch from scratch.
   */
  useEffect(() => {
    setQuestions([]);
    setCursor(undefined);
    setHasNextPage(true);
    fetchQuestions(true);
  }, [filters, searchQuery]);

  /**
   * Fetches questions from the server with the current filters/search/cursor.
   */
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
      };

      if (searchQuery !== "") {
        payload.name = searchQuery;
      }

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

  // Utility to toggle selection of a question
  const toggleSelection = (questionId) => {
    setSelected((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Handles deleting the selected questions
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

  /**
   * Handle "Add Question" button – sets up a blank question form.
   */
  const openAddQuestionModal = () => {
    setIsEditing(false);
    setNewQuestion({
      subject: "",
      chapter: "",
      grade: "",
      type: "MCQ",
      questionText: "",
      imageUrls: [],
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
  };

  /**
   * Handle "Edit Question" button – sets up the selected question in newQuestion.
   * (In a real app, you might also have "subject", "chapter", "grade" stored for each question.)
   */
  const handleEditQuestion = () => {
    const selectedIds = Object.keys(selected).filter((id) => selected[id]);
    if (selectedIds.length === 1) {
      const questionId = selectedIds[0];
      const questionToEdit = questions.find(
        (q) => q.id.toString() === questionId.toString()
      );
      if (questionToEdit) {
        setNewQuestion({
          // If your DB has subject/chapter/grade stored, set them here
          subject: questionToEdit.subject || "",
          chapter: questionToEdit.chapter || "",
          grade: questionToEdit.grade || "",
          id: questionToEdit.id,
          type: questionToEdit.type,
          questionText: questionToEdit.questionText,
          imageUrls: questionToEdit.imageUrls || [],
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

  // SHIFT + $ insertion – optional logic
  const MATH_MARKER = "\u200B";
  const handleMathKeyDown = (e, field, index = null) => {
    // Only do something if you want SHIFT + $ or META + $ etc.
    // For simplicity, let's keep it a no-op or a placeholder:
  };

  /**
   * Generic text change for newQuestion fields and MCQ options.
   */
  const handleNewQuestionChange = (e, field, index = null) => {
    if (field === "option" && index !== null) {
      // MCQ option text
      setNewQuestion((prev) => {
        const options = [...prev.options];
        options[index] = { ...options[index], option: e.target.value };
        return { ...prev, options };
      });
    } else {
      // All other normal fields
      setNewQuestion((prev) => ({ ...prev, [field]: e.target.value }));
    }
  };

  /**
   * Instead of uploading immediately, we store the File objects in newQuestion.imageUrls.
   * We'll differentiate them from existing string URLs on final submit.
   */
  const handleQuestionImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setNewQuestion((prev) => ({
      ...prev,
      imageUrls: [...prev.imageUrls, ...files],
    }));
  };

  /**
   * Remove a single image (existing URL or newly added File) from newQuestion.imageUrls.
   */
  const removeQuestionImage = (index) => {
    setNewQuestion((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  };

  /**
   * For each MCQ option, we store a single new File or existing string.
   */
  const handleOptionImageChange = (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNewQuestion((prev) => {
      const options = [...prev.options];
      options[index] = { ...options[index], imageUrl: file };
      return { ...prev, options };
    });
  };

  /**
   * Remove an existing or newly added option image for a particular MCQ option.
   */
  const removeOptionImage = (index) => {
    setNewQuestion((prev) => {
      const options = [...prev.options];
      options[index] = { ...options[index], imageUrl: "" };
      return { ...prev, options };
    });
  };

  /**
   * Check if the mandatory fields are filled:
   *   type, difficulty, marks, questionText
   */
  const isFormValid = () => {
    const { type, difficulty, marks, questionText } = newQuestion;
    if (!type || !difficulty || !marks || !questionText.trim()) {
      return false;
    }
    return true;
  };

  /**
   * Final submission:
   *  1) Upload any newly added Files to S3
   *  2) Merge them into final URLs
   *  3) Upsert the question in the DB
   */
  const handleNewQuestionSubmit = async () => {
    // If mandatory fields missing, don't proceed
    if (!isFormValid()) {
      alert("Please fill in all mandatory fields before saving.");
      return;
    }

    try {
      // 1) Process question-level images
      let finalImageUrls = [];
      for (const item of newQuestion.imageUrls) {
        if (typeof item === "string") {
          // Already an existing URL
          finalImageUrls.push(item);
        } else {
          // It's a File object => upload to S3
          const targetLink = `https://tutor-staffroom-files.s3.ap-south-1.amazonaws.com/${Date.now()}-${
            item.name
          }`;
          const uploadedUrl = await uploadToS3(item, targetLink);
          finalImageUrls.push(uploadedUrl);
        }
      }

      // 2) Process option images if MCQ
      let finalOptions = [];
      if (newQuestion.type === "MCQ") {
        finalOptions = await Promise.all(
          newQuestion.options.map(async (opt) => {
            if (!opt.imageUrl) {
              // No image or user removed it
              return { ...opt, imageUrl: "" };
            }
            if (typeof opt.imageUrl === "string") {
              // Existing URL from DB
              return { ...opt, imageUrl: opt.imageUrl };
            } else {
              // It's a File => upload
              const targetLink = `https://tutor-staffroom-files.s3.ap-south-1.amazonaws.com/${Date.now()}-${
                opt.imageUrl.name
              }`;
              const uploaded = await uploadToS3(opt.imageUrl, targetLink);
              return { ...opt, imageUrl: uploaded };
            }
          })
        );
      }

      // 3) Build final payload
      // Convert subject, chapter, grade to lowercase
      const payload = {
        ...newQuestion,
        subject: newQuestion.subject?.toLowerCase(),
        chapter: newQuestion.chapter?.toLowerCase(),
        grade: newQuestion.grade?.toLowerCase(),
        imageUrls: finalImageUrls,
        difficulty: newQuestion.difficulty?.toLowerCase(),
      };
      if (newQuestion.type === "MCQ") {
        payload.options = finalOptions;
      } else {
        // Remove options if not MCQ
        delete payload.options;
      }

      if (isEditing && newQuestion.id) {
        // Existing question
        payload.id = newQuestion.id;
      }

      // 4) Upsert question in DB
      const response = await postRequest(
        `${BASE_URL_API}/question/upsert`,
        payload
      );
      if (response?.success) {
        alert(
          isEditing
            ? "Question updated successfully!"
            : "Question added successfully!"
        );
      } else {
        alert("Failed to upsert question.");
      }

      // 5) Reset local states
      setShowAddQuestionModal(false);
      setIsEditing(false);
      setNewQuestion({
        subject: "",
        chapter: "",
        grade: "",
        type: "MCQ",
        questionText: "",
        imageUrls: [],
        marks: "",
        difficulty: "",
        options: [
          { key: "A", option: "", imageUrl: "" },
          { key: "B", option: "", imageUrl: "" },
          { key: "C", option: "", imageUrl: "" },
          { key: "D", option: "", imageUrl: "" },
        ],
      });
      setSelected({});
      setQuestions([]);
      setCursor(undefined);
      setHasNextPage(true);
      // Reload questions
      fetchQuestions(true);
    } catch (error) {
      console.error("Error upserting question:", error);
      alert("Error upserting question.");
    }
  };

  // ----- CREATE QUESTION PAPER FLOW -----
  const handleCreatePaper = () => {
    setShowPaperDialog(true);
  };

  const handleCustomPaperClick = () => {
    setShowPaperDialog(false);
    setShowCustomCreateModal(true);
  };

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
        // Navigate to your custom question paper generation page
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

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: "white" }}>
      {/* Header */}
      <header className={headerClass}>
        <h2 className="text-2xl font-semibold text-gray-800">Questions</h2>
        <div className="ml-auto flex items-center">
          <button
            onClick={() => navigate("/question-paper-list")}
            className={`inline-flex items-center ${primaryButtonClass} mr-4`}
          >
            <FileText className="w-4 h-4 mr-2" />
            Question Papers
          </button>
          <button onClick={handleCreatePaper} className={primaryButtonClass}>
            <FileText className="w-4 h-4 mr-2" />
            Create Question Paper
          </button>
          <div style={{ marginLeft: "10px" }}>
            <ProfileMenu />
          </div>
        </div>
      </header>

      <div className="flex pt-20">
        {/* Filter Sidebar */}
        {showFilterPanel && (
          <aside className="fixed top-20 left-0 w-64 h-[calc(100vh-80px)] border-r px-4 py-2 overflow-y-auto bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Filters</h2>
            </div>

            {/* Active filters */}
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

            {/* Filter Groups */}
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

            {/* Reset Filters */}
            <button
              onClick={resetAllFilters}
              className={`${blackButtonClass} w-full mt-4`}
            >
              Reset Filters
            </button>
          </aside>
        )}

        {/* Main Content */}
        <main
          className={`flex-1 p-4 ${showFilterPanel ? "ml-64" : ""}`}
          style={{ position: "relative" }}
        >
          {/* Fixed action bar */}
          <div
            className={`fixed z-50 bg-white p-4 border-b ${
              showFilterPanel ? "left-64" : "left-0"
            } right-0`}
            style={{ top: "80px" }}
          >
            <div className="flex justify-between">
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className="px-3 py-2 border rounded"
              >
                {showFilterPanel ? "Hide Filters" : "Show Filters"}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={openAddQuestionModal}
                  className={blackButtonClass}
                >
                  Add Question
                </button>
                <EditQuestionWrapper />
                {/* Delete button only if at least 1 selected */}
                {Object.keys(selected).some((id) => selected[id]) && (
                  <button
                    onClick={handleDeleteQuestions}
                    className={blackButtonClass}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="pt-[72px]">
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
              <div className="space-y-4" ref={questionRef}>
                {questions.map((question) => (
                  <div
                    key={question.id}
                    className="flex justify-between p-4 border border-gray-200 rounded-lg shadow-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selected[question.id] || false}
                      onChange={() => toggleSelection(question.id)}
                      className="mt-1 mr-3"
                      style={{ height: "20px" }}
                    />
                    <div className="flex-1">
                      <div className="mb-2">
                        {renderTextWithMath(question.questionText)}
                      </div>

                      {/* Question-level images */}
                      {question.imageUrls && question.imageUrls.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {question.imageUrls.map((url, idx) => (
                            <img
                              key={idx}
                              src={url}
                              alt={`Question ${question.id} preview ${idx}`}
                              className="rounded w-48 h-48 object-cover"
                            />
                          ))}
                        </div>
                      )}

                      {/* MCQ Options */}
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
                                  className="rounded w-24 h-24 object-cover"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-2 text-sm text-gray-600">
                        {question.subject && (
                          <span className="mr-2">
                            Subject: {question.subject}
                          </span>
                        )}
                        {question.chapter && (
                          <span className="mr-2">
                            Chapter: {question.chapter}
                          </span>
                        )}
                        {question.grade && (
                          <span className="mr-2">Grade: {question.grade}</span>
                        )}
                        <br />
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
          </div>
        </main>
      </div>

      {/* Add/Edit Question Modal */}
      {showAddQuestionModal && (
        <div className={modalContainerClass}>
          <div className={modalContentClass}>
            {/* Buttons at the top */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {isEditing ? "Edit Question" : "Add New Question"}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAddQuestionModal(false);
                    setIsEditing(false);
                    // Reset newQuestion
                    setNewQuestion({
                      subject: "",
                      chapter: "",
                      grade: "",
                      type: "MCQ",
                      questionText: "",
                      imageUrls: [],
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
                  className="px-3 py-1 border border-black rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNewQuestionSubmit}
                  className="px-3 py-1 border border-black rounded bg-black text-white"
                  disabled={!isFormValid()}
                >
                  {isEditing ? "Update" : "Save"} Question
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Fields marked with (<span className="text-red-500">*</span>) are
              mandatory.
            </p>

            {/* Subject */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">Subject</label>
              <select
                value={newQuestion.subject}
                onChange={(e) => handleNewQuestionChange(e, "subject")}
                className={inputClass}
              >
                <option value="">Select Subject (optional)</option>
                {subjectOptions.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub.charAt(0).toUpperCase() + sub.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">Chapter</label>
              <input
                type="text"
                value={newQuestion.chapter}
                onChange={(e) => handleNewQuestionChange(e, "chapter")}
                className={inputClass}
                placeholder="Enter Chapter (optional)"
              />
            </div>

            {/* Grade */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">Grade</label>
              <input
                type="text"
                value={newQuestion.grade}
                onChange={(e) => handleNewQuestionChange(e, "grade")}
                className={inputClass}
                placeholder="Enter Grade (optional)"
              />
            </div>

            {/* Question Type */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">
                Question Type <span className="text-red-500">*</span>
              </label>
              <select
                value={newQuestion.type}
                onChange={(e) => handleNewQuestionChange(e, "type")}
                className={inputClass}
              >
                <option value="">Select Type</option>
                {questionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Question Text */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">
                Question Text <span className="text-red-500">*</span>
              </label>
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

            {/* Question Images */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">
                Question Images (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleQuestionImageChange}
                className="block"
                multiple
              />
              {/* Show existing or newly added images */}
              {newQuestion.imageUrls?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {newQuestion.imageUrls.map((item, idx) => {
                    // If it's a string, it's an existing URL
                    // If it's a File, we generate a preview
                    const isFile = typeof item !== "string";
                    const src = isFile ? URL.createObjectURL(item) : item;
                    return (
                      <div key={idx} className="relative">
                        <img
                          src={src}
                          alt={`Question preview ${idx}`}
                          className="rounded w-24 h-24 border object-cover"
                        />
                        <button
                          onClick={() => removeQuestionImage(idx)}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                        >
                          X
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* MCQ Options */}
            {newQuestion.type === "MCQ" && (
              <div className="mb-4">
                <label className="block mb-1 font-medium">Options</label>
                {newQuestion.options.map((option, index) => (
                  <div key={option.key} className="mb-4 border p-2 rounded">
                    <label className="block text-sm font-medium">
                      Option {option.key}
                    </label>
                    {/* Option Text */}
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

                    {/* Option Image */}
                    <div className="mt-2">
                      <label className="block text-sm font-medium">
                        Option {option.key} Image (optional)
                      </label>
                      {!option.imageUrl ? (
                        // If no image is set, show upload
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleOptionImageChange(e, index)}
                          className="block"
                        />
                      ) : typeof option.imageUrl === "string" ? (
                        // If existing URL
                        <div className="relative">
                          <img
                            src={option.imageUrl}
                            alt={`Option ${option.key} existing`}
                            className="mt-2 rounded w-24 h-24 border object-cover"
                          />
                          <button
                            onClick={() => removeOptionImage(index)}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        // It's a new File
                        <div className="relative">
                          <img
                            src={URL.createObjectURL(option.imageUrl)}
                            alt={`Option ${option.key} new`}
                            className="mt-2 rounded w-24 h-24 border object-cover"
                          />
                          <button
                            onClick={() => removeOptionImage(index)}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                          >
                            X
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Marks & Difficulty (both mandatory) */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block mb-1 font-medium">
                  Marks <span className="text-red-500">*</span>
                </label>
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
                <label className="block mb-1 font-medium">
                  Difficulty <span className="text-red-500">*</span>
                </label>
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
          </div>
        </div>
      )}

      {/* Create Paper Dialog */}
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

      {/* Custom Paper Modal */}
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
