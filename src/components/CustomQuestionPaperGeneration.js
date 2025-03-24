/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Trash,
  Image as ImageIcon,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import { postRequest, getRequest } from "../utils/ApiCall";
import { uploadToS3 } from "../utils/s3utils";
import {
  BASE_URL_API,
  difficulties,
  examDays,
  examMonths,
  examNames,
  examYears,
  grades,
  marksOptions,
  questionTypes,
  shifts,
  streams,
  subjects,
  types,
} from "../constants/constants";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { v4 as uuidv4 } from "uuid";

// --- FilterGroupAccordion Component ---
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

// --- QuestionBankModal Component ---
export const QuestionBankModal = ({ onClose, onImport }) => {
  const blackButtonClass =
    "inline-flex items-center px-4 py-2 bg-black text-white font-semibold rounded-lg hover:bg-black transition-colors duration-200";
  // Questions and selection states
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [infiniteLoading, setInfiniteLoading] = useState(false);

  // Updated filters as multi-select arrays
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
  const [searchTerm, setSearchTerm] = useState("");
  const [cursor, setCursor] = useState(undefined);
  const [hasNextPage, setHasNextPage] = useState(true);
  const scrollContainerRef = useRef(null);

  // State for filter accordions open/close
  const [openFilterGroups, setOpenFilterGroups] = useState({
    marks: false,
    types: false,
    difficulties: false,
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

  // State to toggle the entire left panel visibility
  const [showFilterPanel, setShowFilterPanel] = useState(true);

  const onToggleAccordion = (filterKey) => {
    setOpenFilterGroups((prev) => ({
      ...prev,
      [filterKey]: !prev[filterKey],
    }));
  };

  const toggleFilterValue = (filterKey, value) => {
    setFilters((prev) => {
      const existingValues = prev[filterKey];
      let newValues;
      if (existingValues.includes(value)) {
        newValues = existingValues.filter((v) => v !== value);
      } else {
        newValues = [...existingValues, value];
      }
      return { ...prev, [filterKey]: newValues };
    });
  };

  // Define filter groups to display—all filters from state
  const filterGroups = [
    { label: "Marks", key: "marks", values: marksOptions },
    { label: "Types", key: "types", values: types },
    { label: "Difficulty", key: "difficulties", values: difficulties },
    { label: "Grades", key: "grades", values: grades },
    { label: "Subjects", key: "subjects", values: subjects },
    { label: "Exam Days", key: "examDays", values: examDays },
    { label: "Exam Months", key: "examMonths", values: examMonths },
    { label: "Exam Years", key: "examYears", values: examYears },
    { label: "Shifts", key: "shifts", values: shifts },
    { label: "Streams", key: "streams", values: streams },
    { label: "Exam Names", key: "examNames", values: examNames },
    { label: "Question Types", key: "questionTypes", values: questionTypes },
  ];

  // --- Fetch Questions ---
  const fetchQuestions = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
      setQuestions([]);
      setCursor(undefined);
      setHasNextPage(true);
    } else {
      setInfiniteLoading(true);
    }
    try {
      const queryParams = new URLSearchParams({ limit: "10" });
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
        ...(cursor && { cursor }),
        ...(searchTerm && { search: searchTerm }),
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
      console.error("Error fetching question bank:", error);
    }
    if (isInitialLoad) {
      setLoading(false);
    } else {
      setInfiniteLoading(false);
    }
  };

  // --- Infinite Scroll Logic ---
  const handleInfiniteScroll = useCallback(() => {
    if (!hasNextPage || infiniteLoading || loading) return;
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    const scrollThreshold = 100;
    const { clientHeight, scrollTop, scrollHeight } = scrollContainer;
    if (clientHeight + scrollTop >= scrollHeight - scrollThreshold) {
      fetchQuestions(false);
    }
  }, [hasNextPage, infiniteLoading, loading, cursor]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      const handleScroll = () => {
        handleInfiniteScroll();
      };
      scrollContainer.addEventListener("scroll", handleScroll);
      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll);
      };
    }
  }, [handleInfiniteScroll]);

  useEffect(() => {
    fetchQuestions(true);
  }, [filters, searchTerm]);

  const toggleSelect = (id) => {
    setSelectedQuestions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Render math text
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div
        className="bg-white rounded-lg shadow-xl overflow-hidden flex flex-col"
        style={{ width: "90%", height: "90%" }}
      >
        {/* Modal Header with Filter Panel Toggle */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Question Bank</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="px-3 py-2 border rounded"
            >
              {showFilterPanel ? "Hide Filters" : "Show Filters"}
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <span className="text-xl font-bold">&times;</span>
            </button>
          </div>
        </div>

        {/* Modal Content: Left panel for Filters and Right panel for Questions */}
        <div className="flex flex-1 overflow-hidden">
          {showFilterPanel && (
            <div
              className="w-64 border-r overflow-y-auto p-4"
              style={{ backgroundColor: "white" }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">Filters</h2>
                <button
                  className={`${blackButtonClass} px-3 py-2`}
                  onClick={resetAllFilters}
                >
                  Reset
                </button>
              </div>
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
          )}
          <div className="flex-1 overflow-y-auto p-4" ref={scrollContainerRef}>
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">Loading questions...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">No questions found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question) => (
                  <div
                    key={question.id}
                    className={`p-4 border rounded hover:bg-gray-50 transition-colors cursor-pointer ${
                      selectedQuestions.includes(question.id)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                    onClick={() => toggleSelect(question.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="mb-2">
                          {renderTextWithMath(question.questionText)}
                        </div>
                        {question.imageUrl && (
                          <div className="mt-2 mb-3">
                            <img
                              src={question.imageUrl}
                              alt="Question"
                              className="max-h-40 object-contain"
                            />
                          </div>
                        )}
                        {question.type === "MCQ" && question.options && (
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                            {question.options.map((option, index) => (
                              <div key={index} className="flex items-start">
                                <span className="font-semibold mr-2">
                                  {option.key}.
                                </span>
                                <div>
                                  {renderTextWithMath(option.option)}
                                  {option.imageUrl && (
                                    <img
                                      src={option.imageUrl}
                                      alt={`Option ${option.key}`}
                                      className="mt-1 max-h-20 object-contain"
                                    />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end ml-4 space-y-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {question.type}
                        </span>
                        {question.difficulty && (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              question.difficulty.toLowerCase() === "easy"
                                ? "bg-green-100 text-green-800"
                                : question.difficulty.toLowerCase() === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {question.difficulty}
                          </span>
                        )}
                        {question.marks && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {question.marks} marks
                          </span>
                        )}
                        <div className="mt-2 flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedQuestions.includes(question.id)}
                            onChange={() => toggleSelect(question.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {infiniteLoading && (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Loading more questions...</p>
                  </div>
                )}
                {!hasNextPage && questions.length > 0 && (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No more questions to load</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t flex justify-between items-center">
          <div>
            <span className="text-gray-700">
              {selectedQuestions.length} questions selected
            </span>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onImport(selectedQuestions)}
              disabled={selectedQuestions.length === 0}
              className={`px-4 py-2 border border-transparent rounded shadow-sm text-sm font-medium text-white ${
                selectedQuestions.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-black hover:bg-gray-800"
              }`}
            >
              Import Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * COMPONENT: CustomPaperCreatePage
 *
 * This component allows the user to create or edit a custom question paper.
 * The left panel displays sections and questions (with numbering per section).
 * The user can add a new section via a button.
 * When adding a new section, a modal appears where the section name is prefilled
 * with the next alphabetical letter (but can be changed) and, upon confirmation,
 * the section is added and the new question modal is opened for that section.
 * Users can also add, edit, delete, reorder, or import questions from the question bank.
 */
export const CustomPaperCreatePage = () => {
  const location = useLocation();
  // Retrieve questionPaperId passed via navigate state
  const { questionPaperId } = location.state || {};

  // State to hold paper details (sections array)
  const [sections, setSections] = useState([]);
  // States for question editing
  const [originalQuestion, setOriginalQuestion] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState(null);
  const [questionImageFile, setQuestionImageFile] = useState(null);
  // Search state for left panel
  const [searchTerm, setSearchTerm] = useState("");
  // Modal for adding a new question (for a section)
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [sectionForNewQuestion, setSectionForNewQuestion] = useState(null);
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
  // For optional question selection
  const [selectedOptionalQuestions, setSelectedOptionalQuestions] = useState(
    []
  );
  // Panel resizing state
  const [leftPanelWidth, setLeftPanelWidth] = useState(33);
  const [isResizing, setIsResizing] = useState(false);
  // Modal for importing questions from question bank
  const [showBankModal, setShowBankModal] = useState({
    visible: false,
    sectionName: null,
  });
  // Modal for adding a new section
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");

  // ======================= Helper Functions =======================
  const getNextSectionLetter = () => {
    if (!sections || sections.length === 0) return "A";
    const letters = sections
      .map((sec) => sec.name.trim().toUpperCase())
      .filter((name) => /^[A-Z]$/.test(name));
    if (letters.length === 0) return "A";
    const maxLetter = letters.reduce((prev, curr) =>
      curr.charCodeAt(0) > prev.charCodeAt(0) ? curr : prev
    );
    const nextCharCode = maxLetter.charCodeAt(0) + 1;
    if (nextCharCode > "Z".charCodeAt(0)) return "A";
    return String.fromCharCode(nextCharCode);
  };

  // ======================= API CALLS =======================
  const fetchQuestionPaperDetails = async () => {
    try {
      const response = await getRequest(
        `${BASE_URL_API}/questionPaper/${questionPaperId}`
      );
      if (response?.success) {
        setSections(response.questionPaper.sections || []);
      } else {
        console.error("Failed to fetch question paper details:", response);
      }
    } catch (error) {
      console.error("Error fetching question paper details:", error);
    }
  };

  useEffect(() => {
    fetchQuestionPaperDetails();
  }, []);

  // =============== QUESTION CLICK / SELECTION ===============
  const handleQuestionClick = (question) => {
    setOriginalQuestion(question);
    setEditedQuestion(JSON.parse(JSON.stringify(question)));
    setQuestionImageFile(null);
  };

  const isModified =
    editedQuestion && originalQuestion
      ? JSON.stringify(editedQuestion) !== JSON.stringify(originalQuestion) ||
        questionImageFile !== null
      : false;

  // =============== RENDERING MATH UTILS ===============
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

  // ======================= MOUSE EVENTS FOR PANEL RESIZING =======================
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      let newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth < 25) newWidth = 25;
      if (newWidth > 50) newWidth = 50;
      setLeftPanelWidth(newWidth);
    };
    const handleMouseUp = () => {
      if (isResizing) setIsResizing(false);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);
  const handleMouseDown = () => setIsResizing(true);

  // ======================= LEFT PANEL FILTERING =======================
  const getFilteredSections = () => {
    const lowerSearch = searchTerm?.toLowerCase();
    const filtered = sections.map((section) => {
      const filteredQuestions = section.questions.filter((q) =>
        q.questionText?.toLowerCase().includes(lowerSearch)
      );
      return { ...section, questions: filteredQuestions };
    });
    return filtered;
  };
  const visibleSections = getFilteredSections();
  const isEditingMath = editedQuestion?.questionText?.includes("$");

  const toggleOptionalSelection = (questionId, e) => {
    e.stopPropagation();
    setSelectedOptionalQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };
  const handleMarkAsOptional = async () => {
    if (selectedOptionalQuestions.length !== 2) return;
    const optionalGroupId = uuidv4();
    const updatedSections = sections.map((section) => {
      const updatedQuestions = section.questions.map((q) =>
        selectedOptionalQuestions.includes(q.id) ? { ...q, optionalGroupId } : q
      );
      return { ...section, questions: updatedQuestions };
    });
    setSections(updatedSections);
    const payload = {
      id: questionPaperId,
      sections: updatedSections,
    };
    const response = await postRequest(
      `${BASE_URL_API}/questionPaper/update`,
      payload
    );
    if (response.success) {
      alert("Questions marked as optional successfully!");
      setSelectedOptionalQuestions([]);
      await fetchQuestionPaperDetails();
    } else {
      alert("Failed to mark questions as optional.");
    }
  };

  // ======================= EDITING HANDLERS =======================
  const handleQuestionTextChange = (e) => {
    setEditedQuestion((prev) => ({ ...prev, questionText: e.target.value }));
  };
  const handleTypeChange = (e) => {
    setEditedQuestion((prev) => ({ ...prev, type: e.target.value }));
  };
  const handleDifficultyChange = (e) => {
    setEditedQuestion((prev) => ({ ...prev, difficulty: e.target.value }));
  };
  const handleMarksChange = (e) => {
    setEditedQuestion((prev) => ({ ...prev, marks: e.target.value }));
  };
  const handleOptionChange = (index, newValue) => {
    setEditedQuestion((prev) => {
      const updatedOptions = [...(prev.options || [])];
      updatedOptions[index] = { ...updatedOptions[index], option: newValue };
      return { ...prev, options: updatedOptions };
    });
  };

  // ======================= IMAGE HANDLERS (EDIT) =======================
  const handleQuestionImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setQuestionImageFile(file);
  };
  const handleDeleteQuestionImage = () => {
    setQuestionImageFile(null);
    setEditedQuestion((prev) => ({ ...prev, imageUrl: "" }));
  };
  const handleDiscardQuestionImage = () => {
    setQuestionImageFile(null);
  };
  const handleOptionImageChange = (index, file) => {
    setEditedQuestion((prev) => {
      const updatedOptions = [...(prev.options || [])];
      updatedOptions[index] = { ...updatedOptions[index], imageFile: file };
      return { ...prev, options: updatedOptions };
    });
  };
  const handleDeleteOptionImage = (index) => {
    setEditedQuestion((prev) => {
      const updatedOptions = [...(prev.options || [])];
      delete updatedOptions[index].imageUrl;
      delete updatedOptions[index].imageFile;
      return { ...prev, options: updatedOptions };
    });
  };
  const handleDiscardOptionImage = (index) => {
    setEditedQuestion((prev) => {
      const updatedOptions = [...(prev.options || [])];
      if (updatedOptions[index].imageFile) {
        delete updatedOptions[index].imageFile;
      }
      return { ...prev, options: updatedOptions };
    });
  };

  // ======================= SAVE (EDITED) QUESTION =======================
  const handleSave = async () => {
    try {
      let updatedImageUrl = editedQuestion.imageUrl || "";
      if (questionImageFile) {
        const generatedLink = `https://tutor-staffroom-files.s3.amazonaws.com/${Date.now()}-${
          questionImageFile.name
        }`;
        updatedImageUrl = await uploadToS3(questionImageFile, generatedLink);
      }
      const updatedOptions = await Promise.all(
        (editedQuestion.options || []).map(async (opt) => {
          let updatedOpt = { ...opt };
          if (opt.imageFile) {
            const generatedLink = `https://tutor-staffroom-files.s3.amazonaws.com/${Date.now()}-${
              opt.imageFile.name
            }`;
            const uploadedUrl = await uploadToS3(opt.imageFile, generatedLink);
            updatedOpt.imageUrl = uploadedUrl;
            delete updatedOpt.imageFile;
          }
          return updatedOpt;
        })
      );
      const finalQuestion = {
        ...editedQuestion,
        imageUrl: updatedImageUrl,
        options: updatedOptions,
        difficulty: editedQuestion.difficulty?.toLowerCase(),
      };
      const response = await postRequest(`${BASE_URL_API}/question/upsert`, {
        ...finalQuestion,
        questionPaperId: parseInt(questionPaperId),
        id: finalQuestion.id,
      });
      if (response && response.success) {
        alert("Question updated successfully!");
      } else {
        alert("Failed to update question.");
      }
      await fetchQuestionPaperDetails();
      setOriginalQuestion(null);
      setEditedQuestion(null);
      setQuestionImageFile(null);
    } catch (error) {
      console.error("Error saving question:", error);
      alert("Error saving question.");
    }
  };

  // ======================= DELETE QUESTION =======================
  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?"))
      return;
    try {
      const res = await postRequest(
        `${BASE_URL_API}/questionPaper/removeQuestion`,
        {
          questionId,
          questionPaperId: parseInt(questionPaperId),
        }
      );
      if (res?.success) {
        alert("Question deleted successfully");
        await fetchQuestionPaperDetails();
        if (editedQuestion && editedQuestion.id === questionId) {
          setOriginalQuestion(null);
          setEditedQuestion(null);
        }
      } else {
        alert("Failed to delete question.");
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      alert("Error deleting question.");
    }
  };

  // ======================= DRAG AND DROP REORDERING =======================
  const handleDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) {
      const sectionIndex = parseInt(source.droppableId, 10);
      const section = sections[sectionIndex];
      const newQuestions = Array.from(section.questions);
      const [removed] = newQuestions.splice(source.index, 1);
      newQuestions.splice(destination.index, 0, removed);
      const updatedSections = [...sections];
      updatedSections[sectionIndex] = { ...section, questions: newQuestions };
      setSections(updatedSections);
      const payload = {
        id: questionPaperId,
        sections: updatedSections,
      };
      const response = await postRequest(
        `${BASE_URL_API}/questionPaper/update`,
        payload
      );
      if (!response?.success) {
        console.error("Failed to update question order:", response);
      }
      await fetchQuestionPaperDetails();
    }
  };

  // ======================= ADD NEW QUESTION (Existing Flow) =======================
  const handleAddQuestionForSection = (sectionName) => {
    setSectionForNewQuestion(sectionName);
    setShowAddQuestionModal(true);
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
  };

  // For text-based changes in new question form
  const handleNewQuestionChange = (e, field, index) => {
    if (["type", "questionText", "marks", "difficulty"].includes(field)) {
      setNewQuestion((prev) => ({ ...prev, [field]: e.target.value }));
    } else if (field === "option" && typeof index === "number") {
      setNewQuestion((prev) => {
        const newOptions = [...prev.options];
        newOptions[index].option = e.target.value;
        return { ...prev, options: newOptions };
      });
    }
  };

  const handleMathKeyDown = (e, field, index) => {
    // Optional logic for SHIFT+$ or similar
  };

  const handleQuestionImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewQuestion((prev) => ({
      ...prev,
      imageFile: file,
      imageUrl: URL.createObjectURL(file),
    }));
  };

  const handleOptionImageUpload = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewQuestion((prev) => {
      const newOptions = [...prev.options];
      newOptions[index] = {
        ...newOptions[index],
        imageFile: file,
        imageUrl: URL.createObjectURL(file),
      };
      return { ...prev, options: newOptions };
    });
  };

  // A simple function to figure out the next order index
  const calculateNextOrderIndex = (sectionName) => {
    const foundSection = sections.find((sec) => sec.name === sectionName);
    if (!foundSection) return 1;
    return foundSection.questions.length + 1;
  };

  // ======================= NEW SECTION CREATION =======================
  const handleAddSection = () => {
    if (!newSectionName.trim()) {
      alert("Please enter a valid section name.");
      return;
    }
    const newSection = { name: newSectionName.trim(), questions: [] };
    setSections([...sections, newSection]);
    setShowAddSectionModal(false);
    setNewSectionName("");
  };

  // ======================= IMPORT FROM QUESTION BANK =======================
  const handleImportQuestions = async (selectedIds) => {
    if (!selectedIds || selectedIds.length === 0) {
      setShowBankModal({ visible: false, sectionName: null });
      return;
    }
    const foundSection = sections.find(
      (sec) => sec.name === showBankModal.sectionName
    );
    const baseIndex = foundSection ? foundSection.questions.length : 0;
    const questionDetails = selectedIds.map((qId, i) => ({
      questionId: qId,
      orderIndex: baseIndex + i + 1,
      section: showBankModal.sectionName,
    }));
    try {
      const body = {
        questionPaperId: parseInt(questionPaperId),
        questionDetails,
      };
      const resp = await postRequest(
        `${BASE_URL_API}/questionPaper/addQuestions`,
        body
      );
      console.log(resp, "response");
      if (resp?.success) {
        alert("Imported questions successfully!");
        await fetchQuestionPaperDetails();
      } else {
        alert(resp?.message || "Failed to import questions");
      }
    } catch (err) {
      console.error("Error importing questions:", err);
      alert("Error importing questions.");
    }
    setShowBankModal({ visible: false, sectionName: null });
  };

  const handleDeleteSection = async ({ sectionName }) => {
    const updatedSections = sections.filter(
      (section) => section.name !== sectionName
    );
    setSections(updatedSections);
    const payload = {
      id: questionPaperId,
      sections: updatedSections,
    };
    const response = await postRequest(
      `${BASE_URL_API}/questionPaper/update`,
      payload
    );
    if (response.success) {
      await fetchQuestionPaperDetails();
    } else {
      alert("Failed to mark questions as optional.");
    }
  };

  // ======================= NEW QUESTION SUBMISSION (Existing Flow) =======================
  const handleNewQuestionSubmit = async () => {
    try {
      let uploadedQuestionImageUrl = newQuestion.imageUrl || "";
      if (newQuestion.imageFile) {
        const generatedLink = `https://tutor-staffroom-files.s3.amazonaws.com/${Date.now()}-${
          newQuestion.imageFile.name
        }`;
        uploadedQuestionImageUrl = await uploadToS3(
          newQuestion.imageFile,
          generatedLink
        );
      }
      const updatedOptions = await Promise.all(
        (newQuestion.options || []).map(async (opt) => {
          const updatedOpt = { ...opt };
          if (opt.imageFile) {
            const generatedLink = `https://tutor-staffroom-files.s3.amazonaws.com/${Date.now()}-${
              opt.imageFile.name
            }`;
            const uploadedUrl = await uploadToS3(opt.imageFile, generatedLink);
            updatedOpt.imageUrl = uploadedUrl;
            delete updatedOpt.imageFile;
          }
          return updatedOpt;
        })
      );
      const orderIndex = calculateNextOrderIndex(sectionForNewQuestion);
      let createQuestionBody = {
        ...newQuestion,
        imageUrl: uploadedQuestionImageUrl,
        options: newQuestion.type === "MCQ" ? updatedOptions : undefined,
        difficulty: newQuestion.difficulty?.toLowerCase(),
        orderIndex,
        section: sectionForNewQuestion,
        questionPaperId: parseInt(questionPaperId),
      };
      await postRequest(`${BASE_URL_API}/question/upsert`, createQuestionBody);
      await fetchQuestionPaperDetails();
      setShowAddQuestionModal(false);
      setSectionForNewQuestion(null);
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
    } catch (error) {
      console.error("Error adding new question:", error);
      alert("Error adding question.");
    }
  };

  const toggleSectionCollapse = (sectionIndex) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionIndex]: !prev[sectionIndex],
    }));
  };

  return (
    <div className="flex h-screen overflow-hidden fixed inset-0">
      {/* ===================== LEFT PANEL (SECTIONS + QUESTIONS) ===================== */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div
          className="border-r p-4 overflow-y-auto"
          style={{ width: `${leftPanelWidth}%`, minWidth: "15%" }}
        >
          {/* Top Controls: Search box and "Add New Section" button */}
          <div className="mb-4 flex flex-col gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search questions..."
              className="w-full p-2 border rounded"
            />
            <button
              onClick={() => {
                setNewSectionName(getNextSectionLetter());
                setShowAddSectionModal(true);
              }}
              className="px-4 py-2 bg-black text-white font-semibold rounded hover:bg-black transition-colors"
            >
              Add New Section
            </button>
          </div>

          {/* If exactly 2 non-MCQ selected => show Mark as Optional */}
          {selectedOptionalQuestions.length === 2 && (
            <div className="mb-4">
              <button
                onClick={handleMarkAsOptional}
                className="px-4 py-2 rounded shadow-md"
                style={{ backgroundColor: "black", color: "white" }}
              >
                Mark as Optional
              </button>
            </div>
          )}

          {visibleSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-6">
              {/* Section Heading with Import and Add Question buttons */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">Section {section.name}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSectionCollapse(sectionIndex)}
                    className="p-2 rounded flex items-center justify-center bg-black text-white"
                    title="Toggle section collapse"
                  >
                    {collapsedSections[sectionIndex] ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronUp size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => handleAddQuestionForSection(section.name)}
                    className="p-2 rounded bg-black text-white flex items-center justify-center"
                    title="Add a new question to this section"
                  >
                    <Plus size={16} className="text-white" />
                  </button>
                  <button
                    onClick={() =>
                      setShowBankModal({
                        visible: true,
                        sectionName: section.name,
                      })
                    }
                    className="p-2 rounded bg-black text-white flex items-center justify-center text-sm"
                    style={{ height: "32px" }}
                  >
                    Import questions
                  </button>
                  {/* Uncomment below if section deletion is needed */}
                  {/*
                  {sections.length >= 2 && (
                    <button
                      onClick={() =>
                        handleDeleteSection({ sectionName: section.name })
                      }
                      className="p-2 rounded bg-red-500 text-white flex items-center justify-center"
                      title="Delete this section"
                    >
                      <Trash size={16} className="text-white" />
                    </button>
                  )}
                  */}
                </div>
              </div>
              {!collapsedSections[sectionIndex] && (
                <Droppable droppableId={`${sectionIndex}`}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {section.questions.map((question, index) => {
                        const isSelected = editedQuestion?.id === question.id;
                        const questionNumber = index + 1;
                        return (
                          <Draggable
                            key={question.id}
                            draggableId={`${question.id}`}
                            index={index}
                          >
                            {(dragProvided) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                onClick={() => handleQuestionClick(question)}
                                className={`flex justify-between items-center p-3 mb-3 rounded shadow cursor-pointer transition-colors ${
                                  isSelected
                                    ? "bg-blue-50 border-l-4 border-blue-500"
                                    : "bg-white hover:bg-gray-100"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-gray-700">
                                    {questionNumber}.
                                  </span>
                                  {question.type !== "MCQ" && (
                                    <input
                                      type="checkbox"
                                      checked={selectedOptionalQuestions.includes(
                                        question.id
                                      )}
                                      onChange={(e) =>
                                        toggleOptionalSelection(question.id, e)
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  )}
                                  <span>
                                    {renderTruncatedTextWithMath(
                                      question.questionText,
                                      60
                                    )}
                                  </span>
                                  {question.optionalGroupId && (
                                    <span className="ml-2 text-xs font-bold text-green-800 bg-green-200 px-1 rounded">
                                      Optional
                                    </span>
                                  )}
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
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* ===================== RESIZE HANDLE ===================== */}
      <div
        onMouseDown={handleMouseDown}
        style={{ width: "5px", cursor: "col-resize" }}
        className="bg-gray-300"
      />

      {/* ===================== RIGHT PANEL (EDIT SELECTED QUESTION) ===================== */}
      <div
        className="p-4 overflow-hidden"
        style={{ width: `${100 - leftPanelWidth}%`, minWidth: "40%" }}
      >
        {!originalQuestion ? (
          <div className="text-gray-500">Select a question to edit</div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">Question Details</h2>
              {editedQuestion?.optionalGroupId && (
                <span className="bg-green-200 text-green-800 text-xs px-2 py-1 rounded">
                  Optional
                </span>
              )}
              {isModified && (
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-white rounded shadow-md"
                  style={{ backgroundColor: "black" }}
                >
                  Save
                </button>
              )}
            </div>
            <div className="flex flex-col md:flex-row md:items-start gap-4">
              <div className="md:w-2/3">
                <div className="flex flex-wrap gap-2 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Type:</span>
                    <input
                      type="text"
                      value={editedQuestion.type || ""}
                      onChange={handleTypeChange}
                      className="w-auto bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold shadow-sm focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Difficulty:</span>
                    <input
                      type="text"
                      value={editedQuestion.difficulty || ""}
                      onChange={handleDifficultyChange}
                      className="w-auto bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold shadow-sm focus:outline-none"
                    />
                  </div>
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
                <div className="mt-4 flex items-start gap-2">
                  <span className="font-semibold">Question Image:</span>
                  {editedQuestion.imageUrl || questionImageFile ? (
                    <div className="flex items-center gap-2 ml-4">
                      <img
                        src={
                          questionImageFile
                            ? URL.createObjectURL(questionImageFile)
                            : editedQuestion.imageUrl
                        }
                        alt="Question"
                        className="max-w-xs"
                        style={{ height: 32, width: 32 }}
                      />
                      {questionImageFile ? (
                        <>
                          <button
                            onClick={handleDiscardQuestionImage}
                            className="px-2 py-1 bg-gray-200 rounded text-sm"
                          >
                            Discard
                          </button>
                          <button
                            onClick={handleDeleteQuestionImage}
                            className="px-2 py-1 bg-red-200 rounded text-sm"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <>
                          <label
                            htmlFor="question-image-input"
                            className="cursor-pointer"
                          >
                            <ImageIcon
                              size={20}
                              className="text-gray-500 hover:text-gray-700"
                            />
                          </label>
                          <button
                            onClick={handleDeleteQuestionImage}
                            className="px-2 py-1 bg-red-200 rounded text-sm"
                          >
                            Remove
                          </button>
                        </>
                      )}
                      <input
                        id="question-image-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleQuestionImageChange}
                      />
                    </div>
                  ) : (
                    <label
                      htmlFor="question-image-input"
                      className="cursor-pointer"
                    >
                      <ImageIcon
                        size={20}
                        className="text-gray-500 hover:text-gray-700"
                      />
                      <input
                        id="question-image-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleQuestionImageChange}
                      />
                    </label>
                  )}
                </div>
              </div>
              {isEditingMath && (
                <div className="md:w-1/2 border-l pl-4">
                  <h3 className="font-semibold mb-2">Math Preview</h3>
                  <div className="bg-gray-50 p-3 rounded">
                    {renderTextWithMath(editedQuestion.questionText)}
                  </div>
                </div>
              )}
            </div>
            {editedQuestion.options && editedQuestion.options.length > 0 && (
              <div>
                <strong>Options</strong>
                <ul className="list-disc ml-6 mt-2 space-y-3">
                  {editedQuestion.options.map((opt, idx) => (
                    <li key={idx} className="ml-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{opt.key}.</span>
                        <textarea
                          className="w-1/2 p-2 border rounded min-h-[40px]"
                          value={opt.option || ""}
                          onChange={(e) =>
                            handleOptionChange(idx, e.target.value)
                          }
                        />
                        {opt.imageUrl || opt.imageFile ? (
                          <div className="flex items-center gap-2 ml-2">
                            <img
                              src={
                                opt.imageFile
                                  ? URL.createObjectURL(opt.imageFile)
                                  : opt.imageUrl
                              }
                              alt={`Option ${opt.key}`}
                              className="max-w-[50px]"
                            />
                            {opt.imageFile ? (
                              <>
                                <button
                                  onClick={() => handleDiscardOptionImage(idx)}
                                  className="px-2 py-1 bg-gray-200 rounded text-sm"
                                  title="Discard new image"
                                >
                                  Discard
                                </button>
                                <button
                                  onClick={() => handleDeleteOptionImage(idx)}
                                  className="px-2 py-1 bg-red-200 rounded text-sm"
                                  title="Remove Option Image"
                                >
                                  <Trash size={16} />
                                </button>
                              </>
                            ) : (
                              <>
                                <label
                                  htmlFor={`option-image-${idx}`}
                                  className="cursor-pointer"
                                  title="Change Option Image"
                                >
                                  <ImageIcon
                                    size={20}
                                    className="text-gray-500 hover:text-gray-700"
                                  />
                                </label>
                                <button
                                  onClick={() => handleDeleteOptionImage(idx)}
                                  className="px-2 py-1 bg-red-200 rounded text-sm"
                                  title="Remove Option Image"
                                >
                                  <Trash size={16} />
                                </button>
                              </>
                            )}
                            <input
                              id={`option-image-${idx}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                handleOptionImageChange(idx, e.target.files[0])
                              }
                            />
                          </div>
                        ) : (
                          <>
                            <label
                              htmlFor={`option-image-${idx}`}
                              className="cursor-pointer"
                              title="Upload Option Image"
                            >
                              <ImageIcon
                                size={20}
                                className="text-gray-500 hover:text-gray-700"
                              />
                            </label>
                            <input
                              id={`option-image-${idx}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                handleOptionImageChange(idx, e.target.files[0])
                              }
                            />
                          </>
                        )}
                      </div>
                      {opt.option && opt.option.includes("$") && (
                        <div className="ml-8 bg-gray-50 p-2 rounded text-sm text-gray-700">
                          {renderTextWithMath(opt.option)}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===================== RESIZE HANDLE ===================== */}
      <div
        onMouseDown={handleMouseDown}
        style={{ width: "5px", cursor: "col-resize" }}
        className="bg-gray-300"
      />

      {/* ===================== NEW SECTION CREATION MODAL ===================== */}
      {showAddSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white border border-gray-300 shadow-lg rounded-lg w-[400px] p-6 relative">
            <button
              onClick={() => setShowAddSectionModal(false)}
              className="absolute top-2 right-2 text-black font-bold"
            >
              X
            </button>
            <h2 className="text-lg font-semibold mb-4 text-black">
              Add New Section
            </h2>
            <div className="mb-4">
              <label className="block text-black mb-1 font-medium">
                Section Name
              </label>
              <input
                type="text"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter section name"
              />
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowAddSectionModal(false)}
                className="px-3 py-1 border border-black rounded bg-white text-black"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSection}
                className="px-3 py-1 border border-black rounded bg-black text-white"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== IMPORT FROM QUESTION BANK MODAL ===================== */}
      {showBankModal.visible && (
        <QuestionBankModal
          onClose={() =>
            setShowBankModal({ visible: false, sectionName: null })
          }
          onImport={handleImportQuestions}
        />
      )}

      {/* ===================== ADD NEW QUESTION MODAL ===================== */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white w-[600px] max-h-[80vh] overflow-auto rounded p-4 relative">
            <button
              onClick={() => {
                setShowAddQuestionModal(false);
                setSectionForNewQuestion(null);
              }}
              className="absolute top-2 right-2 text-black font-bold"
            >
              X
            </button>
            <h3 className="text-lg font-semibold mb-4 text-black">
              Add New Question (Section {sectionForNewQuestion})
            </h3>
            <div className="mb-4">
              <label className="block mb-1 font-medium text-black">
                Question Type
              </label>
              <select
                value={newQuestion.type}
                onChange={(e) => handleNewQuestionChange(e, "type")}
                className="border rounded px-2 py-1 w-full"
              >
                <option value="MCQ">MCQ</option>
                <option value="Descriptive">Descriptive</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium text-black">
                Question Text
              </label>
              <textarea
                value={newQuestion.questionText}
                onChange={(e) => handleNewQuestionChange(e, "questionText")}
                onKeyDown={(e) => handleMathKeyDown(e, "questionText")}
                className="border rounded px-2 py-1 w-full"
                rows={4}
                placeholder="Enter question text (use $ for math expressions if needed)"
              />
              <div className="mt-2 text-sm text-gray-500">
                Preview: {renderTextWithMath(newQuestion.questionText)}
              </div>
            </div>
            <div className="mb-4 text-black">
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
                  alt="Preview"
                  className="mt-2 w-32 h-32 border rounded object-cover"
                />
              )}
            </div>
            {newQuestion.type === "MCQ" && (
              <div className="mb-4 text-black">
                <label className="block mb-1 font-medium">Options</label>
                {newQuestion.options.map((opt, idx) => (
                  <div key={opt.key} className="mb-4 border p-2 rounded">
                    <label className="block text-sm font-medium text-black">
                      Option {opt.key}
                    </label>
                    <input
                      type="text"
                      value={opt.option}
                      onChange={(e) =>
                        handleNewQuestionChange(e, "option", idx)
                      }
                      onKeyDown={(e) => handleMathKeyDown(e, "option", idx)}
                      className="border rounded px-2 py-1 w-full mb-1"
                      placeholder={`Option ${opt.key} text`}
                    />
                    <div className="mt-1 text-sm text-gray-500">
                      Preview: {renderTextWithMath(opt.option)}
                    </div>
                    <div className="mt-2">
                      <label className="block text-sm font-medium">
                        Option {opt.key} Image (optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleOptionImageUpload(e, idx)}
                        className="block"
                      />
                      {opt.imageUrl && (
                        <img
                          src={opt.imageUrl}
                          alt={`Option ${opt.key} preview`}
                          className="mt-2 rounded w-24 h-24 border"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-4 mb-4 text-black">
              <div className="flex-1">
                <label className="block mb-1 font-medium">Marks</label>
                <input
                  type="number"
                  value={newQuestion.marks}
                  onChange={(e) => handleNewQuestionChange(e, "marks")}
                  className="border rounded px-2 py-1 w-full"
                />
              </div>
              <div className="flex-1">
                <label className="block mb-1 font-medium">Difficulty</label>
                <select
                  value={newQuestion.difficulty}
                  onChange={(e) => handleNewQuestionChange(e, "difficulty")}
                  className="border rounded px-2 py-1 w-full"
                >
                  <option value="">Select Difficulty</option>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowAddQuestionModal(false);
                  setSectionForNewQuestion(null);
                }}
                className="px-3 py-1 border border-black rounded bg-white text-black"
              >
                Cancel
              </button>
              <button
                onClick={handleNewQuestionSubmit}
                className="px-3 py-1 border border-black rounded bg-black text-white"
              >
                Save Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Uncomment below if import modal is needed */}
      {/*
      {showBankModal.visible && (
        <QuestionBankModal
          onClose={() => setShowBankModal({ visible: false, sectionName: null })}
          onImport={handleImportQuestions}
        />
      )}
      */}
    </div>
  );
};

export default CustomPaperCreatePage;
