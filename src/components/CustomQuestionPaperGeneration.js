/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Trash,
  Image as ImageIcon,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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
  INVALID_TOKEN,
  marksOptions,
  questionTypes,
  shifts,
  streams,
  subjects,
  types,
} from "../constants/constants";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { v4 as uuidv4 } from "uuid";
import { removeDataFromLocalStorage } from "../utils/LocalStorageOps";
import {
  renderTextWithMath,
  renderTruncatedTextWithMath,
} from "./RenderTextWithMath";
import ResizableTextarea from "./ResizableTextArea";

/**
 * API to generate HTML link for question paper preview
 */
const getHtmlLink = async (questionPaperId) => {
  const url = `${BASE_URL_API}/questionpaper/generateHtml`;
  const body = { questionPaperId };
  try {
    const result = await postRequest(url, body);
    return result?.questionPaper; // e.g., a URL to the generated HTML/PDF
  } catch (error) {
    console.error("Error generating HTML:", error);
  }
};

const modalContainerClass =
  "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60";
const modalContentClass =
  "bg-white border border-gray-300 shadow-lg rounded-lg w-[800px] max-h-[90vh] overflow-auto p-6 relative";

// --- FilterGroupAccordion Component (from your code) ---
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

export const QuestionBankModal = ({ onClose, onImport }) => {
  const blackButtonClass =
    "inline-flex items-center px-4 py-2 bg-black text-white font-semibold rounded-lg hover:bg-black transition-colors duration-200";

  // Questions list
  const [questions, setQuestions] = useState([]);

  // --- ADDED for "Show Selected" Feature ---
  // Keep track of selected question IDs (already existed),
  // plus full question objects for easier rendering in "Selected" view.
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [selectedQuestionObjs, setSelectedQuestionObjs] = useState([]);
  // Toggle between normal/all-questions view and selected-questions view
  const [viewSelected, setViewSelected] = useState(false);
  const [showChaptersModal, setShowChaptersModal] = useState(false);

  // ------------------------------------------------------------

  const [loading, setLoading] = useState(false);
  const [infiniteLoading, setInfiniteLoading] = useState(false);
  const [chapters, setChapters] = useState([]);

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
    chapters: [],
  });
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
    chapters: false,
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

  // Define filter groups to display
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
  const fetchQuestions = async (isInitialLoad = false, customCursor) => {
    if (isInitialLoad) {
      setLoading(true);
      setQuestions([]);
      setCursor(undefined);
      setHasNextPage(true);
    } else {
      setInfiniteLoading(true);
    }
    try {
      const queryParams = new URLSearchParams({
        limit: "10",
        ...(typeof customCursor !== "undefined" && { cursor: customCursor }),
      });
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
        ...(filters.chapters.length > 0 && {
          chapters: filters.chapters,
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
      fetchQuestions(false, cursor);
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
  }, [filters]);

  // --- ADDED: track selected IDs and question objects together ---
  const toggleSelect = (id) => {
    setSelectedQuestions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

    // Find the question object in the current "questions" array
    const foundQ = questions.find((q) => q.id === id);
    if (!foundQ) return; // Shouldn't happen if user is only selecting from the loaded list

    setSelectedQuestionObjs((prev) => {
      const isAlreadySelected = prev.some((q) => q.id === id);
      if (isAlreadySelected) {
        // remove it
        return prev.filter((q) => q.id !== id);
      } else {
        // add it
        return [...prev, foundQ];
      }
    });
  };

  const removeSelectedQuestion = (questionId) => {
    // De-select from IDs
    setSelectedQuestions((prev) => prev.filter((id) => id !== questionId));
    // Remove from the question objs
    setSelectedQuestionObjs((prev) => prev.filter((q) => q.id !== questionId));
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

  useEffect(() => {
    const fetchChapters = async (grade, subject, examName) => {
      try {
        const body = { grade, subject, examName };
        const response = await postRequest(
          `${BASE_URL_API}/question/get-chapters`,
          body
        );
        // Suppose the API returns { chapters: [...] }
        if (response && response.chapters) {
          setChapters(response.chapters);
        }
      } catch (error) {
        console.error("Error fetching chapters:", error);
      }
    };

    // Only call if user has exactly 1 grade & exactly 1 subject selected
    if (
      (filters.grades.length === 1 || filters.examNames.length === 1) &&
      filters.subjects.length === 1
    ) {
      fetchChapters(
        filters.grades[0],
        filters.subjects[0],
        filters.examNames[0]
      );
    } else {
      // Otherwise, reset chapters
      setFilters((prev) => ({ ...prev, chapters: [] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.grades, filters.subjects]);

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
        {showChaptersModal && (
          <div className={modalContainerClass}>
            <div className={`${modalContentClass} max-w-md`}>
              <h2 className="text-xl font-semibold mb-4">Select Chapters</h2>
              <div className="flex flex-wrap gap-2">
                {chapters && chapters.length > 0 ? (
                  chapters.map((ch) => {
                    const isSelected = filters.chapters.includes(ch);
                    return (
                      <span
                        key={ch}
                        onClick={() => toggleFilterValue("chapters", ch)}
                        className={`px-3 py-1 rounded-full cursor-pointer transition-colors text-sm ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                        }`}
                      >
                        {ch}
                      </span>
                    );
                  })
                ) : (
                  <p>No chapters available</p>
                )}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setShowChaptersModal(false)}
                  className="px-4 py-2 border rounded"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Content: Left panel for Filters and Right panel for Questions */}
        <div className="flex flex-1 overflow-hidden">
          {showFilterPanel && (
            <div
              className="w-64 border-r overflow-y-auto p-4"
              style={{ backgroundColor: "white" }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">Filters</h2>
                <div className="flex gap-2">
                  <button
                    className={`${blackButtonClass} px-3 py-2`}
                    onClick={resetAllFilters}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Filter Groups */}
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
              {chapters.length > 0 && (
                <button
                  onClick={() => setShowChaptersModal(true)}
                  className={`${blackButtonClass} w-full mt-4`}
                >
                  {filters.chapters.length > 0
                    ? `Chapters (${filters.chapters.length} selected)`
                    : "Select Chapters"}
                </button>
              )}
              <button
                onClick={() => setViewSelected((prev) => !prev)}
                className={`${blackButtonClass} w-full mt-4`}
              >
                {viewSelected ? "Show All" : "Show Selected"}
              </button>
            </div>
          )}

          {/* Right Panel */}
          <div className="flex-1 overflow-y-auto p-4" ref={scrollContainerRef}>
            {/* ADDED: Conditionally show "selected questions" or "all questions" */}
            {viewSelected ? (
              // SHOW SELECTED QUESTIONS
              selectedQuestionObjs.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <p className="text-gray-500">No questions selected</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedQuestionObjs.map((question) => (
                    <div
                      key={question.id}
                      className="p-4 border rounded hover:bg-gray-50 transition-colors"
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
                          {question.type === "mcq" && question.options && (
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
                                  : question.difficulty.toLowerCase() ===
                                    "medium"
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
                          {/* Remove button instead of checkbox */}
                          <button
                            onClick={() => removeSelectedQuestion(question.id)}
                            className="text-red-500 hover:text-red-700 border rounded px-2 py-1 text-sm"
                          >
                            ✕ Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : loading ? (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">Loading questions...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">No questions found</p>
              </div>
            ) : (
              // SHOW ALL QUESTIONS (normal listing)
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
                        {question.type === "mcq" && question.options && (
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

// =================== MAIN COMPONENT ===================
export const CustomPaperCreatePage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve questionPaperId passed via navigate state
  const { questionPaperId, numberOfSets, grade, subject } =
    location.state || {};

  // State to hold paper details (sections array)
  const [sections, setSections] = useState([]);

  // States for question editing
  const [originalQuestion, setOriginalQuestion] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState(null);
  const [questionImageUrls, setQuestionImageUrls] = useState([]);

  // Search state for left panel
  const [searchTerm, setSearchTerm] = useState("");

  // Modal for adding a new question
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [isEditingNewQuestion, setIsEditingNewQuestion] = useState(false);
  const [sectionForNewQuestion, setSectionForNewQuestion] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    type: "mcq",
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

  // For toggling collapsed sections
  const [collapsedSections, setCollapsedSections] = useState({});

  // ---------------------
  // NEW: PREVIEW MODAL
  // ---------------------
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDocument, setModalDocument] = useState(null);

  // ================== Fetch question paper details ===================
  const fetchQuestionPaperDetails = async () => {
    try {
      const response = await getRequest(
        `${BASE_URL_API}/questionPaper/${questionPaperId}`
      );
      if (response?.success) {
        const sortedSections = sortSectionsAlphabetically(
          response.questionPaper.sections || []
        );
        setSections(sortedSections);
      } else {
        if (response.message === INVALID_TOKEN) {
          removeDataFromLocalStorage();
          navigate("/login");
          return;
        }
        console.error("Failed to fetch question paper details:", response);
      }
    } catch (error) {
      console.error("Error fetching question paper details:", error);
    }
  };

  useEffect(() => {
    fetchQuestionPaperDetails();
  }, []);

  // ======================================================
  // PREVIEW BUTTON HANDLER
  // ======================================================
  const handlePreviewClick = async () => {
    const link = await getHtmlLink(questionPaperId);
    if (link) {
      // link is presumably a URL to the generated HTML (or PDF)
      setModalDocument(link?.questionPaperLink);
      setModalVisible(true);
    } else {
      alert("Failed to generate preview");
    }
  };

  // ================== HELPER: Next Section Letter (A, B, C, ...) ==================
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

  // ================== MOUSE EVENTS FOR PANEL RESIZING ==================
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

  // ================== LEFT PANEL FILTERING ==================
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

  // ================== OPTIONAL QUESTIONS LOGIC ==================
  const toggleOptionalSelection = (questionId, e) => {
    e.stopPropagation();
    setSelectedOptionalQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  /**
   * Unmarks the selected questions from optional by removing their optionalGroupId.
   */
  const handleUnmarkAsOptional = async () => {
    // Only meaningful if exactly 2 questions share the same optionalGroupId
    if (selectedOptionalQuestions.length !== 2) return;
    const updatedSections = sections.map((section) => {
      const updatedQuestions = section.questions.map((q) => {
        if (selectedOptionalQuestions.includes(q.id)) {
          return { ...q, optionalGroupId: null };
        }
        return q;
      });
      return { ...section, questions: updatedQuestions };
    });
    setSections(updatedSections);

    const payload = { id: questionPaperId, sections: updatedSections };
    const response = await postRequest(
      `${BASE_URL_API}/questionPaper/update`,
      payload
    );
    if (response.success) {
      alert("Optional status removed successfully!");
      setSelectedOptionalQuestions([]);
      await fetchQuestionPaperDetails();
    } else {
      alert("Failed to remove optional status.");
    }
  };

  const handleMarkAsOptional = async () => {
    if (selectedOptionalQuestions.length !== 2) return;
    const targetSectionIndex = sections.findIndex((section) =>
      selectedOptionalQuestions.every((id) =>
        section.questions.some((q) => q.id === id)
      )
    );
    if (targetSectionIndex === -1) {
      alert("Please select two questions from the same section.");
      return;
    }
    const optionalGroupId = uuidv4();
    const section = sections[targetSectionIndex];
    let sortedQuestions = [...section.questions].sort(
      (a, b) => a.orderIndex - b.orderIndex
    );
    const optionalQuestions = sortedQuestions
      .filter((q) => selectedOptionalQuestions.includes(q.id))
      .sort((a, b) => a.orderIndex - b.orderIndex);
    if (optionalQuestions.length !== 2) {
      alert("Could not find both selected questions in the section.");
      return;
    }
    const firstOptional = optionalQuestions[0];
    const secondOptional = optionalQuestions[1];
    // Remove second question from original position
    sortedQuestions = sortedQuestions.filter((q) => q.id !== secondOptional.id);
    // Insert second question right after the first
    const firstIndex = sortedQuestions.findIndex(
      (q) => q.id === firstOptional.id
    );
    sortedQuestions.splice(firstIndex + 1, 0, { ...secondOptional });
    // Update orderIndex
    sortedQuestions = sortedQuestions.map((q, index) => ({
      ...q,
      orderIndex: index + 1,
      ...(selectedOptionalQuestions.includes(q.id) && { optionalGroupId }),
    }));
    const updatedSections = sections.map((sec, idx) =>
      idx === targetSectionIndex ? { ...sec, questions: sortedQuestions } : sec
    );
    setSections(updatedSections);
    const payload = { id: questionPaperId, sections: updatedSections };
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

  // ================== QUESTION CLICK / EDIT ==================
  const handleQuestionClick = (question) => {
    setOriginalQuestion(question);
    setEditedQuestion(JSON.parse(JSON.stringify(question)));
    setQuestionImageUrls([]);
  };
  const isModified =
    editedQuestion && originalQuestion
      ? JSON.stringify(editedQuestion) !== JSON.stringify(originalQuestion) ||
        questionImageUrls.length > 0
      : false;

  // ================== EDITING HANDLERS ==================
  const handleQuestionTextChange = (e) => {
    setEditedQuestion((prev) => ({ ...prev, questionText: e.target.value }));
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setEditedQuestion((prev) => {
      // If changing from a non-mcq type to mcq, initialize options to 4 default options.
      if (prev.type !== "mcq" && newType === "mcq") {
        return {
          ...prev,
          type: newType,
          options: [
            { key: "A", option: "", imageUrl: "" },
            { key: "B", option: "", imageUrl: "" },
            { key: "C", option: "", imageUrl: "" },
            { key: "D", option: "", imageUrl: "" },
          ],
        };
      }
      // For other cases, simply update the type.
      return {
        ...prev,
        type: newType,
      };
    });
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

  // ================== IMAGE HANDLERS (EDIT) ==================
  const handleQuestionImageChange = (e) => {
    const files = Array.from(e.target.files);
    setQuestionImageUrls((prev) => [...prev, ...files]);
  };
  const handleDeleteQuestionImage = (index) => {
    setEditedQuestion((prev) => {
      const updatedImageUrls = [...(prev.imageUrls || [])];
      updatedImageUrls.splice(index, 1);
      return { ...prev, imageUrls: updatedImageUrls };
    });
  };
  const handleDiscardQuestionImage = (index) => {
    setQuestionImageUrls((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };
  const handleOptionImageChange = (index, file) => {
    setEditedQuestion((prev) => {
      const updatedOptions = [...(prev.options || [])];
      updatedOptions[index] = {
        ...updatedOptions[index],
        imageUrl: file,
      };
      return { ...prev, options: updatedOptions };
    });
  };
  const handleDeleteOptionImage = (index) => {
    setEditedQuestion((prev) => {
      const updatedOptions = [...(prev.options || [])];
      delete updatedOptions[index].imageUrl;
      return { ...prev, options: updatedOptions };
    });
  };
  const handleDiscardOptionImage = (index) => {
    setEditedQuestion((prev) => {
      const updatedOptions = [...(prev.options || [])];
      if (updatedOptions[index].imageUrl) {
        delete updatedOptions[index].imageUrl;
      }
      return { ...prev, options: updatedOptions };
    });
  };

  // ================== SAVE (EDITED) QUESTION ==================
  const handleSave = async () => {
    try {
      let updatedImageUrls = editedQuestion.imageUrls || [];
      // Upload new images
      if (questionImageUrls.length > 0) {
        const uploadedUrls = await Promise.all(
          questionImageUrls.map(async (file) => {
            const generatedLink = `https://tutor-staffroom-files.s3.amazonaws.com/${Date.now()}-${
              file.name
            }`;
            return await uploadToS3(file, generatedLink);
          })
        );
        updatedImageUrls = [...updatedImageUrls, ...uploadedUrls];
      }
      // Upload new option images
      const updatedOptions = await Promise.all(
        (editedQuestion.options || []).map(async (opt) => {
          let updatedOption = { ...opt };
          if (opt.imageUrl && typeof opt.imageUrl !== "string") {
            const generatedLink = `https://tutor-staffroom-files.s3.amazonaws.com/${Date.now()}-${
              opt.imageUrl.name
            }`;
            const uploadedUrl = await uploadToS3(opt.imageUrl, generatedLink);
            updatedOption.imageUrl = uploadedUrl;
          }
          return updatedOption;
        })
      );

      const finalQuestion = {
        ...editedQuestion,
        imageUrls: updatedImageUrls,
        options: updatedOptions,
        difficulty: editedQuestion.difficulty?.toLowerCase(),
      };

      const response = await postRequest(`${BASE_URL_API}/question/upsert`, {
        ...finalQuestion,
        questionPaperId: parseInt(questionPaperId),
        id: finalQuestion.id,
        grade: parseInt(grade),
        subject,
      });
      if (response && response.success) {
        alert("Question updated successfully!");
      } else {
        alert("Failed to update question.");
      }
      await fetchQuestionPaperDetails();
      setOriginalQuestion(null);
      setEditedQuestion(null);
      setQuestionImageUrls([]);
    } catch (error) {
      console.error("Error saving question:", error);
      alert("Error saving question.");
    }
  };

  // ================== DELETE QUESTION ==================
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

  // ================== DRAG AND DROP REORDERING ==================
  const handleDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceSectionIndex = parseInt(source.droppableId, 10);
    const destSectionIndex = parseInt(destination.droppableId, 10);

    const sourceSection = sections[sourceSectionIndex];
    const destSection = sections[destSectionIndex];

    // Clone the questions array
    const updatedSections = [...sections];

    if (sourceSectionIndex === destSectionIndex) {
      // Same section reorder
      const updatedQuestions = [...sourceSection.questions];
      const [movedQuestion] = updatedQuestions.splice(source.index, 1);
      updatedQuestions.splice(destination.index, 0, movedQuestion);

      // Update orderIndex
      const reordered = updatedQuestions.map((q, i) => ({
        ...q,
        orderIndex: i + 1,
      }));

      updatedSections[sourceSectionIndex] = {
        ...sourceSection,
        questions: reordered,
      };
    } else {
      // Cross-section move
      const sourceQuestions = [...sourceSection.questions];
      const [movedQuestion] = sourceQuestions.splice(source.index, 1);

      const destQuestions = [...destSection.questions];
      destQuestions.splice(destination.index, 0, {
        ...movedQuestion,
        section: destSection.name,
      });

      updatedSections[sourceSectionIndex] = {
        ...sourceSection,
        questions: sourceQuestions.map((q, i) => ({ ...q, orderIndex: i + 1 })),
      };
      updatedSections[destSectionIndex] = {
        ...destSection,
        questions: destQuestions.map((q, i) => ({
          ...q,
          section: destSection.name,
          orderIndex: i + 1,
        })),
      };
    }

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
    } else {
      await fetchQuestionPaperDetails();
    }
  };

  // ================== ADD NEW QUESTION (EXISTING FLOW) ==================
  const handleAddQuestionForSection = (sectionName) => {
    setSectionForNewQuestion(sectionName);
    setShowAddQuestionModal(true);
    setIsEditingNewQuestion(false);
    setNewQuestion({
      type: "mcq",
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
  };

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
    // optional if you want special handling for math input
  };
  const handleQuestionImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setNewQuestion((prev) => ({
      ...prev,
      imageUrls: [...prev.imageUrls, ...files],
    }));
  };
  const handleOptionImageUpload = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewQuestion((prev) => {
      const newOptions = [...prev.options];
      newOptions[index] = {
        ...newOptions[index],
        imageUrl: file,
      };
      return { ...prev, options: newOptions };
    });
  };
  const calculateNextOrderIndex = (sectionName) => {
    const foundSection = sections.find((sec) => sec.name === sectionName);
    if (!foundSection) return 1;
    return foundSection.questions.length + 1;
  };

  const sortSectionsAlphabetically = (sections) => {
    return [...sections].sort((a, b) => a.name.localeCompare(b.name));
  };

  // ================== NEW SECTION CREATION ==================
  const handleAddSection = () => {
    if (!newSectionName.trim()) {
      alert("Please enter a valid section name.");
      return;
    }
    const newSec = { name: newSectionName.trim(), questions: [] };
    const updated = [...sections, newSec];
    const sorted = sortSectionsAlphabetically(updated);
    setSections(sorted);
    setShowAddSectionModal(false);
    setNewSectionName("");
  };

  // ================== IMPORT FROM QUESTION BANK ==================
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

  const handleAddOption = () => {
    setNewQuestion((prev) => {
      const newOptions = [...prev.options];
      const newKey = String.fromCharCode(65 + newOptions.length);
      newOptions.push({ key: newKey, option: "", imageUrl: "" });
      return { ...prev, options: newOptions };
    });
  };
  const handleRemoveOption = (index) => {
    setNewQuestion((prev) => {
      let newOptions = [...prev.options];
      if (newOptions.length > 2) {
        newOptions.splice(index, 1);
        // rename keys (A,B,C,...)
        newOptions = newOptions.map((opt, idx) => ({
          ...opt,
          key: String.fromCharCode(65 + idx),
        }));
        return { ...prev, options: newOptions };
      }
      return prev;
    });
  };

  const handleNewQuestionSubmit = async () => {
    try {
      let uploadedImageUrls = [];
      if (newQuestion.imageUrls?.length > 0) {
        const uploadedUrls = await Promise.all(
          newQuestion.imageUrls.map(async (file) => {
            const generatedLink = `https://tutor-staffroom-files.s3.amazonaws.com/${Date.now()}-${
              file.name
            }`;
            return await uploadToS3(file, generatedLink);
          })
        );
        uploadedImageUrls = uploadedUrls;
      }
      const updatedOptions = await Promise.all(
        (newQuestion.options || []).map(async (opt) => {
          let updatedOption = { ...opt };
          if (opt.imageUrl && typeof opt.imageUrl !== "string") {
            const generatedLink = `https://tutor-staffroom-files.s3.amazonaws.com/${Date.now()}-${
              opt.imageUrl.name
            }`;
            const uploadedUrl = await uploadToS3(opt.imageUrl, generatedLink);
            updatedOption.imageUrl = uploadedUrl;
          }
          return updatedOption;
        })
      );
      const orderIndex = calculateNextOrderIndex(sectionForNewQuestion);
      let createQuestionBody = {
        ...newQuestion,
        imageUrls: uploadedImageUrls,
        options: newQuestion.type === "mcq" ? updatedOptions : undefined,
        difficulty: newQuestion.difficulty?.toLowerCase(),
        orderIndex,
        section: sectionForNewQuestion,
        questionPaperId: parseInt(questionPaperId),
        grade: parseInt(grade),
        subject,
      };
      if (newQuestion.type !== "mcq") {
        delete createQuestionBody.options;
      }
      await postRequest(`${BASE_URL_API}/question/upsert`, createQuestionBody);
      await fetchQuestionPaperDetails();
      setShowAddQuestionModal(false);
      setSectionForNewQuestion(null);
      setNewQuestion({
        type: "mcq",
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

  const groupQuestions = (questions) => {
    const groups = [];
    const seen = new Set();
    questions.forEach((q) => {
      if (q.optionalGroupId) {
        if (!seen.has(q.optionalGroupId)) {
          const grouped = questions.filter(
            (x) => x.optionalGroupId === q.optionalGroupId
          );
          groups.push({ groupId: q.optionalGroupId, questions: grouped });
          grouped.forEach((item) => seen.add(item.optionalGroupId));
        }
      } else {
        groups.push({ groupId: null, questions: [q] });
      }
    });
    return groups;
  };

  const isNewQuestionValid = () => {
    const { type, questionText, marks, difficulty, options } = newQuestion;
    if (
      !type ||
      !questionText.trim() ||
      !marks ||
      Number(marks) < 0 ||
      !difficulty
    ) {
      return false;
    }
    if (type === "mcq") {
      for (let opt of options) {
        if (!opt.option.trim()) return false;
      }
    }
    return true;
  };

  const handleAddOptionEdit = () => {
    setEditedQuestion((prev) => {
      const newOptions = [...(prev.options || [])];
      const newKey = String.fromCharCode(65 + newOptions.length);
      newOptions.push({ key: newKey, option: "", imageUrl: "" });
      return { ...prev, options: newOptions };
    });
  };

  const handleRemoveOptionEdit = (index) => {
    setEditedQuestion((prev) => {
      let newOptions = [...(prev.options || [])];
      if (newOptions.length > 2) {
        newOptions.splice(index, 1);
        newOptions = newOptions.map((opt, idx) => ({
          ...opt,
          key: String.fromCharCode(65 + idx),
        }));
        return { ...prev, options: newOptions };
      }
      return prev;
    });
  };

  // Utility to retrieve two selected questions' data
  const getSelectedQuestions = () => {
    const allQuestions = sections.flatMap((section) => section.questions);
    return selectedOptionalQuestions.map((id) =>
      allQuestions.find((q) => q.id === id)
    );
  };

  // Determine if the two selected questions share the same non-null optionalGroupId
  const twoSelectedHaveSameGroupId = () => {
    if (selectedOptionalQuestions.length !== 2) return false;
    const [q1, q2] = getSelectedQuestions();
    if (!q1 || !q2) return false;
    if (!q1.optionalGroupId || !q2.optionalGroupId) return false;
    return q1.optionalGroupId === q2.optionalGroupId;
  };

  // ================== RENDER ==================
  return (
    <div className="flex h-screen overflow-hidden fixed inset-0">
      {/* ================= LEFT PANEL (Sections + Questions) ================= */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div
          className="border-r p-4 overflow-y-auto"
          style={{ width: `${leftPanelWidth}%`, minWidth: "15%" }}
        >
          <div className="mb-4 flex flex-col gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search questions..."
              className="w-full p-2 border rounded"
            />
            {/* Preview button */}
            <button
              onClick={handlePreviewClick}
              className="px-4 py-2 bg-black text-white font-semibold rounded hover:bg-gray-800 transition-colors"
            >
              Preview
            </button>
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

          {/* If exactly 2 non-mcq selected => Mark Optional */}
          {selectedOptionalQuestions.length === 2 && (
            <div className="mb-4">
              {twoSelectedHaveSameGroupId() ? (
                <button
                  onClick={handleUnmarkAsOptional}
                  className="px-4 py-2 rounded shadow-md"
                  style={{ backgroundColor: "black", color: "white" }}
                >
                  Unmark as Optional
                </button>
              ) : (
                <button
                  onClick={handleMarkAsOptional}
                  className="px-4 py-2 rounded shadow-md"
                  style={{ backgroundColor: "black", color: "white" }}
                >
                  Mark as Optional
                </button>
              )}
            </div>
          )}

          {/* Show all visible sections + questions (drag-n-drop not shown for brevity) */}
          {visibleSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-6">
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
                </div>
              </div>
              {!collapsedSections[sectionIndex] && (
                <Droppable droppableId={`${sectionIndex}`}>
                  {(provided) => {
                    const groupedQuestions = groupQuestions(section.questions);
                    return (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                          minHeight:
                            groupedQuestions.length === 0 ? "50px" : "auto",
                        }}
                      >
                        {groupedQuestions.map((group, groupIndex) => {
                          if (group.questions.length > 1) {
                            // Optional group
                            return (
                              <Draggable
                                key={group.groupId}
                                draggableId={group.groupId}
                                index={groupIndex}
                              >
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="mb-3"
                                  >
                                    <div className="flex flex-col items-center">
                                      {group.questions.map((q, idx) => (
                                        <React.Fragment key={q.id}>
                                          <div
                                            className="flex items-center gap-2 p-3 rounded shadow cursor-pointer transition-colors border-l-4 border-blue-500 w-full"
                                            onClick={() =>
                                              handleQuestionClick(q)
                                            }
                                          >
                                            <span
                                              className="font-semibold"
                                              style={{ marginRight: 5 }}
                                            >
                                              {groupIndex + 1}.
                                            </span>
                                            {q.type !== "mcq" && (
                                              <input
                                                type="checkbox"
                                                checked={selectedOptionalQuestions.includes(
                                                  q.id
                                                )}
                                                onClick={(e) =>
                                                  e.stopPropagation()
                                                }
                                                onChange={(e) =>
                                                  toggleOptionalSelection(
                                                    q.id,
                                                    e
                                                  )
                                                }
                                              />
                                            )}
                                            {renderTruncatedTextWithMath(
                                              q.questionText,
                                              100
                                            )}
                                          </div>
                                          {idx < group.questions.length - 1 && (
                                            <div className="w-full text-center text-xs font-semibold text-gray-500 my-1">
                                              OR
                                            </div>
                                          )}
                                        </React.Fragment>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          } else {
                            // Normal question
                            const q = group.questions[0];
                            return (
                              <Draggable
                                key={q.id}
                                draggableId={`${q.id}`}
                                index={groupIndex}
                              >
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => handleQuestionClick(q)}
                                    className="flex justify-between items-center p-3 mb-3 rounded shadow cursor-pointer transition-colors bg-white hover:bg-gray-100"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="font-semibold"
                                        style={{ marginRight: 5 }}
                                      >
                                        {groupIndex + 1}.
                                      </span>
                                      {q.type !== "mcq" && (
                                        <input
                                          type="checkbox"
                                          checked={selectedOptionalQuestions.includes(
                                            q.id
                                          )}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) =>
                                            toggleOptionalSelection(q.id, e)
                                          }
                                        />
                                      )}
                                      {renderTruncatedTextWithMath(
                                        q.questionText,
                                        100
                                      )}
                                      {q.optionalGroupId && (
                                        <span className="ml-2 text-xs font-bold text-green-800 bg-green-200 px-1 rounded">
                                          Optional
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteQuestion(q.id);
                                      }}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <Trash size={16} />
                                    </button>
                                  </div>
                                )}
                              </Draggable>
                            );
                          }
                        })}
                        {provided.placeholder}
                      </div>
                    );
                  }}
                </Droppable>
              )}
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Resize handle */}
      <div
        onMouseDown={() => setIsResizing(true)}
        style={{ width: "5px", cursor: "col-resize" }}
        className="bg-gray-300"
      />

      {/* ============ RIGHT PANEL (EDIT SELECTED QUESTION) ============ */}
      <div
        className="p-4 overflow-auto"
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
                    <select
                      value={editedQuestion.type || ""}
                      onChange={handleTypeChange}
                      className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold shadow-sm focus:outline-none"
                    >
                      <option value="mcq">mcq</option>
                      <option value="descriptive">Descriptive</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Difficulty:</span>
                    <select
                      value={editedQuestion.difficulty || ""}
                      onChange={handleDifficultyChange}
                      className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold shadow-sm focus:outline-none"
                    >
                      <option value="easy">easy</option>
                      <option value="medium">medium</option>
                      <option value="hard">hard</option>
                    </select>
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
                  <ResizableTextarea
                    className="w-full p-2 border rounded"
                    value={editedQuestion.questionText}
                    onChange={(e) => handleQuestionTextChange(e)}
                    style={{ whiteSpace: "pre-wrap" }}
                  />
                </div>
                <div className="my-4">
                  <label className="font-semibold mb-2 block">
                    Question Images:
                  </label>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {editedQuestion.imageUrls?.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`Question ${index + 1}`}
                          className="object-cover rounded border h-24"
                        />
                        <button
                          onClick={() => handleDeleteQuestionImage(index)}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                        >
                          <Trash size={12} />
                        </button>
                      </div>
                    ))}
                    {questionImageUrls.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`New ${index + 1}`}
                          className="h-24 object-cover rounded border"
                        />
                        <button
                          onClick={() => handleDiscardQuestionImage(index)}
                          className="absolute top-0 right-0 bg-gray-500 text-white rounded-full p-1"
                        >
                          <Trash size={12} />
                        </button>
                      </div>
                    ))}
                    <label
                      htmlFor="question-image-input"
                      className="cursor-pointer flex items-center justify-center w-24 h-24 border-2 border-dashed rounded"
                    >
                      <Plus size={24} className="text-gray-500" />
                      <input
                        id="question-image-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleQuestionImageChange}
                        multiple
                      />
                    </label>
                  </div>
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
              {/* Optional real-time math preview, if you want */}
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
                        {opt.imageUrl ? (
                          <div className="flex items-center gap-2 ml-2">
                            <img
                              src={
                                typeof opt.imageUrl === "string"
                                  ? opt.imageUrl
                                  : URL.createObjectURL(opt.imageUrl)
                              }
                              alt={`Option ${opt.key}`}
                              className="h-24"
                            />
                            {typeof opt.imageUrl === "string" ? (
                              <button
                                onClick={() => handleDeleteOptionImage(idx)}
                                className="px-2 py-1 bg-red-200 rounded text-sm"
                                title="Remove Option Image"
                              >
                                <Trash size={16} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDiscardOptionImage(idx)}
                                className="px-2 py-1 bg-gray-200 rounded text-sm"
                                title="Discard new image"
                              >
                                Discard
                              </button>
                            )}
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
                            {editedQuestion.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOptionEdit(idx)}
                                className="ml-4"
                              >
                                Delete
                              </button>
                            )}
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
                <button
                  type="button"
                  onClick={handleAddOptionEdit}
                  className="mt-2 px-3 py-1 border border-black rounded bg-black text-white"
                >
                  Add Option
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Additional right handle (if needed) */}
      <div
        onMouseDown={() => setIsResizing(true)}
        style={{ width: "5px", cursor: "col-resize" }}
        className="bg-gray-300"
      />

      {/* ================== NEW QUESTION MODAL ================== */}
      {showAddQuestionModal && (
        <div className={modalContainerClass}>
          <div className={modalContentClass}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {isEditingNewQuestion ? "Edit Question" : "Add New Question"}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAddQuestionModal(false);
                    setIsEditingNewQuestion(false);
                    setSectionForNewQuestion(null);
                    setNewQuestion({
                      type: "mcq",
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
                  disabled={!isNewQuestionValid()}
                >
                  {isEditingNewQuestion ? "Update Question" : "Save Question"}
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-2">
              * All fields (except images) are mandatory.
            </p>

            {sectionForNewQuestion && (
              <div className="text-gray-700 mb-2">
                <strong>Section:</strong> {sectionForNewQuestion}
              </div>
            )}

            <div className="mb-4">
              <label className="block mb-1 font-medium">
                Question Type <span className="text-red-500">*</span>
              </label>
              <select
                value={newQuestion.type}
                onChange={(e) => handleNewQuestionChange(e, "type")}
                className="border rounded px-2 py-1 w-full"
              >
                <option value="mcq">mcq</option>
                <option value="descriptive">descriptive</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-medium">
                Question Text <span className="text-red-500">*</span>
              </label>
              <ResizableTextarea
                value={newQuestion.questionText}
                onChange={(e) => handleNewQuestionChange(e, "questionText")}
                className="border rounded px-2 py-1 w-full"
                placeholder="Enter question text. Use Shift + $ to add math equations."
              />

              <div className="mt-2 text-sm text-gray-500">
                Preview: {renderTextWithMath(newQuestion.questionText)}
              </div>
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-medium">
                Question Images (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {newQuestion.imageUrls?.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Question ${index + 1}`}
                      className="w-24 h-24 object-cover rounded border"
                    />
                    <button
                      onClick={() => {
                        setNewQuestion((prev) => {
                          const updated = [...prev.imageUrls];
                          updated.splice(index, 1);
                          return { ...prev, imageUrls: updated };
                        });
                      }}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                ))}
                <label
                  htmlFor="new-question-image-input"
                  className="cursor-pointer flex items-center justify-center w-24 h-24 border-2 border-dashed rounded"
                >
                  <Plus size={24} className="text-gray-500" />
                  <input
                    id="new-question-image-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleQuestionImageUpload}
                    multiple
                  />
                </label>
              </div>
            </div>

            {newQuestion.type === "mcq" && (
              <div className="mb-4">
                <label className="block mb-1 font-medium">
                  Options <span className="text-red-500">*</span>
                </label>
                {newQuestion.options.map((option, index) => (
                  <div
                    key={option.key}
                    className="mb-4 border p-2 rounded relative"
                  >
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
                      className="border rounded px-2 py-1 w-full mb-1"
                      placeholder={`Option ${option.key} text (mandatory). Use Shift + $ for math.`}
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
                          src={URL.createObjectURL(option.imageUrl)}
                          alt={`Option ${option.key} preview`}
                          className="mt-2 rounded w-24 h-24 border"
                        />
                      )}
                    </div>
                    {newQuestion.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                        title="Remove option"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="px-3 py-1 border border-black rounded bg-black text-white"
                >
                  Add Option
                </button>
              </div>
            )}

            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block mb-1 font-medium">
                  Marks <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={newQuestion.marks}
                  onChange={(e) => handleNewQuestionChange(e, "marks")}
                  className="border rounded px-2 py-1 w-full"
                  placeholder="e.g. 5"
                />
              </div>
              <div className="flex-1">
                <label className="block mb-1 font-medium">
                  Difficulty <span className="text-red-500">*</span>
                </label>
                <select
                  value={newQuestion.difficulty}
                  onChange={(e) => handleNewQuestionChange(e, "difficulty")}
                  className="border rounded px-2 py-1 w-full"
                >
                  <option value="">Select Difficulty</option>
                  <option value="easy">easy</option>
                  <option value="medium">medium</option>
                  <option value="hard">hard</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================== BANK MODAL (Import from question bank) ================== */}
      {showBankModal.visible && (
        <QuestionBankModal
          onClose={() =>
            setShowBankModal({ visible: false, sectionName: null })
          }
          onImport={handleImportQuestions}
        />
      )}

      {/* ================== ADD SECTION MODAL ================== */}
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

      {/* ================== PREVIEW MODAL ================== */}
      {modalVisible && modalDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white w-11/12 h-[90vh] rounded-lg shadow-xl relative flex flex-col">
            <button
              onClick={() => setModalVisible(false)}
              className="absolute top-4 right-4 px-3 py-1 border border-black rounded bg-black text-white"
            >
              Close
            </button>
            <div className="p-4 flex-1 overflow-auto">
              {/* 
                Display the returned link in an iframe.
                The user can only view and close. 
                (No download actions, no extra buttons)
              */}
              <iframe
                src={modalDocument}
                className="w-full h-full"
                title="Question Paper Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomPaperCreatePage;
