import React, { useState, useEffect, useCallback } from "react";
import { FileText, DownloadIcon, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  grades,
  subjects,
  examDays,
  examMonths,
  examYears,
  shifts,
  streams,
  examNames,
  questionTypes,
  marksOptions,
  types,
  difficulties,
  BASE_URL_API,
} from "../constants/constants";
import DocumentViewer from "./DocumentViewer";
import { removeDataFromLocalStorage } from "../utils/LocalStorageOps";
import { deleteRequest, postRequest } from "../utils/ApiCall";

/**
 * Common CSS classes for styling
 */
const primaryButtonClass =
  "px-4 py-2 bg-black text-white font-semibold rounded-lg hover:bg-black transition-colors";
const commonButtonClass =
  "px-4 py-2 bg-black text-white font-semibold rounded hover:bg-black transition-colors";
const modalButtonClass =
  "p-2 bg-black text-white font-semibold rounded hover:bg-black";
const downloadButtonClass =
  "inline-flex items-center px-3 py-2 bg-black text-white font-semibold rounded-md hover:bg-black transition-colors";
const selectClass =
  "appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-black font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
const dropdownIconClass =
  "absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none";

// Mapping for filter labels (used in chips)
const filterLabels = {
  grade: "Grade",
  subject: "Subject",
  examDays: "Exam Day",
  examMonths: "Exam Month",
  examYears: "Exam Year",
  shifts: "Shift",
  streams: "Stream",
  examNames: "Exam Name",
  marks: "Marks",
  types: "Type",
  difficulties: "Difficulty",
  questionTypes: "Question Type",
};

// Accordion-like component for each filter group
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

export const DocumentSidebar = () => {
  const navigate = useNavigate();

  // List of documents
  const [documents, setDocuments] = useState([]);

  // Pagination states
  const [cursor, setCursor] = useState(undefined);
  const [hasNextPage, setHasNextPage] = useState(true);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [infiniteLoading, setInfiniteLoading] = useState(false);

  // Filters as multi-select arrays.
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

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDocument, setModalDocument] = useState(null);
  const [modalActiveTab, setModalActiveTab] = useState("question");

  // Dialog for AI vs Custom
  const [showPaperDialog, setShowPaperDialog] = useState(false);

  // Custom Paper creation modal states
  const [showCustomCreateModal, setShowCustomCreateModal] = useState(false);
  const [customPaperName, setCustomPaperName] = useState("");
  const [customPaperGrade, setCustomPaperGrade] = useState("");
  const [customPaperSubject, setCustomPaperSubject] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Control the visibility of the left filter panel
  const [showFilterPanel, setShowFilterPanel] = useState(true);

  // Accordion state for each filter group
  const [openFilterGroups, setOpenFilterGroups] = useState({
    grade: true,
    subject: true,
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

  // Define filter groups with all options.
  const filterGroups = [
    { label: "Grade", key: "grade", values: grades.map((g) => `Grade ${g}`) },
    { label: "Subject", key: "subject", values: subjects },
    { label: "Exam Day", key: "examDays", values: examDays },
    { label: "Exam Month", key: "examMonths", values: examMonths },
    { label: "Exam Year", key: "examYears", values: examYears },
    { label: "Shift", key: "shifts", values: shifts },
    { label: "Stream", key: "streams", values: streams },
    { label: "Exam Name", key: "examNames", values: examNames },
    { label: "Marks", key: "marks", values: marksOptions },
    { label: "Type", key: "types", values: types },
    { label: "Difficulty", key: "difficulties", values: difficulties },
    { label: "Question Type", key: "questionTypes", values: questionTypes },
  ];

  // Toggle a filter value in a multi-select
  const toggleFilterValue = (filterKey, value) => {
    setFilters((prev) => {
      const existing = prev[filterKey];
      let newValues;
      if (existing.includes(value)) {
        newValues = existing.filter((v) => v !== value);
      } else {
        newValues = [...existing, value];
      }
      return { ...prev, [filterKey]: newValues };
    });
  };

  // Toggle accordion open/close for a filter group
  const onToggleAccordion = (filterKey) => {
    setOpenFilterGroups((prev) => ({
      ...prev,
      [filterKey]: !prev[filterKey],
    }));
  };

  // Fetch documents from the server
  const fetchDocuments = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setInfiniteLoading(true);
    }
    try {
      const queryParams = new URLSearchParams({
        limit: "10",
        ...(cursor && { cursor }),
      });

      // Build request body from filters
      const requestBody = {};
      if (filters.grade.length > 0) requestBody.grade = filters.grade;
      if (filters.subject.length > 0) requestBody.subject = filters.subject;
      if (filters.examDays.length > 0) requestBody.examDays = filters.examDays;
      if (filters.examMonths.length > 0)
        requestBody.examMonths = filters.examMonths;
      if (filters.examYears.length > 0)
        requestBody.examYears = filters.examYears;
      if (filters.shifts.length > 0) requestBody.shifts = filters.shifts;
      if (filters.streams.length > 0) requestBody.streams = filters.streams;
      if (filters.examNames.length > 0)
        requestBody.examNames = filters.examNames;
      if (filters.marks.length > 0) requestBody.marks = filters.marks;
      if (filters.types.length > 0) requestBody.types = filters.types;
      if (filters.difficulties.length > 0)
        requestBody.difficulties = filters.difficulties.map((d) =>
          d.toLowerCase()
        );
      if (filters.questionTypes.length > 0)
        requestBody.questionTypes = filters.questionTypes;

      const data = await postRequest(
        `${BASE_URL_API}/questionPaper/getPaginatedQuestionPapers?${queryParams.toString()}`,
        requestBody
      );

      if (data.message) {
        if (
          data.message === "Invalid or expired access token" ||
          data.message === "Access token is required"
        ) {
          removeDataFromLocalStorage();
          navigate("/login");
          return;
        }
      }

      if (data.success && data.questionPapers) {
        if (isInitialLoad) {
          setDocuments(data.questionPapers);
        } else {
          setDocuments((prev) => [...prev, ...data.questionPapers]);
        }
        setHasNextPage(data.hasNextPage);
        setCursor(data.nextCursor);
      } else {
        if (isInitialLoad) setDocuments([]);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      if (isInitialLoad) setDocuments([]);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setInfiniteLoading(false);
      }
    }
  };

  // Reset pagination & fetch documents whenever filters change.
  useEffect(() => {
    setDocuments([]);
    setCursor(undefined);
    setHasNextPage(true);
    fetchDocuments(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Infinite scroll logic (for right panel only)
  const handleInfiniteScroll = useCallback(() => {
    if (!hasNextPage || infiniteLoading || loading) return;
    const scrollThreshold = 300;
    const scrolledToBottom =
      window.innerHeight + window.scrollY >=
      document.body.offsetHeight - scrollThreshold;

    if (scrolledToBottom) {
      fetchDocuments(false);
    }
  }, [hasNextPage, infiniteLoading, loading, cursor]);

  useEffect(() => {
    window.addEventListener("scroll", handleInfiniteScroll);
    return () => window.removeEventListener("scroll", handleInfiniteScroll);
  }, [handleInfiniteScroll]);

  // Helper: fetch HTML link for a question paper
  const getHtmlLink = async (questionPaperId) => {
    const url = `${BASE_URL_API}/questionpaper/generateHtml`;
    const body = { questionPaperId };

    try {
      const result = await postRequest(url, body);
      return result?.questionPaper;
    } catch (error) {
      console.error("Error generating HTML:", error);
      throw error;
    }
  };

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

  const downloadAllSetPDFs = async (links) => {
    for (let index = 0; index < links?.length; index++) {
      const link = links[index];
      try {
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          alert("Popup blocked. Please allow pop-ups for this site.");
          return;
        }
        const response = await fetch(link);
        const htmlContent = await response.text();
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        await new Promise((resolve) => {
          printWindow.onload = () => {
            if (printWindow.MathJax && printWindow.MathJax.typesetPromise) {
              printWindow.MathJax.typesetPromise()
                .then(() => {
                  printWindow.print();
                  printWindow.close();
                  resolve();
                })
                .catch((err) => {
                  console.error("Error during MathJax typesetting:", err);
                  printWindow.print();
                  printWindow.close();
                  resolve();
                });
            } else {
              setTimeout(() => {
                printWindow.print();
                printWindow.close();
                resolve();
              }, 500);
            }
          };
        });
      } catch (error) {
        console.error(`Error downloading PDF for set ${index + 1}:`, error);
      }
    }
  };

  const getDocumentName = ({ name }) => {
    const names = name.split("_");
    let capitalisedWords = names.map(
      (n) => n.charAt(0).toUpperCase() + n.slice(1)
    );
    return capitalisedWords.join(" ");
  };

  const getCapitalSubjectName = ({ subject }) => {
    return subject.charAt(0).toUpperCase() + subject.slice(1);
  };

  return (
    <>
      <div className="p-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Documents</h2>
          <button
            onClick={handleCreatePaper}
            className={`mt-4 sm:mt-0 inline-flex items-center ${primaryButtonClass}`}
          >
            <FileText className="w-4 h-4 mr-2" />
            Create Question Paper
          </button>
        </div>

        {/* Horizontal line spanning left and right panels */}
        <hr className="border-t border-gray-300 mb-4" />

        {/* Layout with Left Filter Panel and Main Content Area */}
        <div className="flex">
          {/* Left Panel: Filters (non-scrollable) */}
          {showFilterPanel && (
            <div className="w-64 border-r px-4 py-2 h-screen overflow-y-hidden">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">Filters</h2>
                {/* <button
                  onClick={() => setShowFilterPanel(false)}
                  className="px-3 py-2 border rounded"
                >
                  Hide
                </button> */}
              </div>
              {/* Selected Filters Chips */}
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
              {/* Filter Accordions */}
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
              <button
                onClick={() =>
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
                  })
                }
                className={`${primaryButtonClass} w-full mt-4`}
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Main Content Area (scrollable) */}
          <div className="flex-1 py-2 px-4 overflow-y-auto">
            {/* Toggle Filter Panel Button */}
            <div className="mb-4">
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className="px-3 py-2 border rounded"
              >
                {showFilterPanel ? "Hide Filters" : "Show Filters"}
              </button>
            </div>
            {loading && documents.length === 0 ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="ml-4 text-gray-600">Loading documents...</p>
              </div>
            ) : (
              <div>
                {documents?.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      No question papers found. Adjust your filters or create a
                      new question paper.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg shadow-sm"
                      >
                        <div>
                          <h3 className="text-lg font-medium text-gray-800">
                            {getDocumentName({ name: doc.name })}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {getCapitalSubjectName({ subject: doc.subject })} •
                            Grade {doc.grade}
                          </p>
                          <p className="text-sm text-gray-500">
                            Created on{" "}
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          {/* View */}
                          <button
                            onClick={async () => {
                              const docWithQuestionAndSolutionLink =
                                await getHtmlLink(doc.id);
                              setModalDocument(docWithQuestionAndSolutionLink);
                              setModalActiveTab("question");
                              setModalVisible(true);
                            }}
                            className={commonButtonClass}
                          >
                            View
                          </button>
                          {/* Edit */}
                          <button
                            onClick={() => {
                              if (doc.sections && doc.sections.length > 0) {
                                navigate(`/edit-document/${doc.id}`, {
                                  state: {
                                    sections: doc.sections,
                                    docName: doc.name,
                                  },
                                });
                              } else {
                                alert(
                                  "No sections found for this document. Cannot edit."
                                );
                              }
                            }}
                            className={commonButtonClass}
                          >
                            Edit
                          </button>
                          {/* Delete */}
                          <button
                            onClick={async () => {
                              try {
                                await deleteRequest(
                                  `${BASE_URL_API}/questionPaper/${doc.id}`
                                );
                                setDocuments([]);
                                setCursor(undefined);
                                setHasNextPage(true);
                                fetchDocuments(true);
                              } catch (error) {
                                console.error("Error deleting paper:", error);
                              }
                            }}
                            className={commonButtonClass}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}

                    {hasNextPage ? (
                      infiniteLoading && (
                        <div className="text-center py-4 text-gray-500">
                          Loading more documents...
                        </div>
                      )
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No more documents to load
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for viewing a document */}
      {modalVisible && modalDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white w-11/12 h-[90vh] overflow-auto rounded-lg shadow-xl relative">
            <button
              onClick={() => setModalVisible(false)}
              className={`absolute top-4 right-4 ${modalButtonClass}`}
            >
              Close
            </button>
            <div className="p-4">
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setModalActiveTab("question")}
                  className={commonButtonClass}
                >
                  Question Paper
                </button>
                {modalDocument?.solutionLink && (
                  <button
                    onClick={() => setModalActiveTab("solution")}
                    className={commonButtonClass}
                  >
                    Answer Sheet
                  </button>
                )}
                {modalActiveTab === "question" &&
                  modalDocument?.questionPapersLinks?.length > 0 && (
                    <button
                      onClick={() =>
                        downloadAllSetPDFs(modalDocument.questionPapersLinks)
                      }
                      className={downloadButtonClass}
                    >
                      <DownloadIcon className="w-4 h-4 mr-2" />
                      Download All Sets
                    </button>
                  )}
              </div>
              <DocumentViewer
                documentUrl={
                  modalActiveTab === "question"
                    ? modalDocument.questionPaperLink
                    : modalDocument.solutionLink
                }
                name={`${modalDocument.name} - ${
                  modalActiveTab === "question"
                    ? "Question Paper"
                    : "Answer Sheet"
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* AI vs Custom Paper Choice Dialog */}
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

      {/* Custom Paper Creation Modal */}
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
    </>
  );
};

export default DocumentSidebar;
