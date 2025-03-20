/**
 * This file defines the DocumentSidebar component which serves as a filterable document
 * list and includes functionality for creating, viewing, editing, and deleting question
 * papers. The component also includes a modal-based viewer for viewing question papers
 *
 * Overall Flow:
 * 1. We have filter accordions on the left to filter the list of question papers from an API.
 * 2. As a user scrolls, more documents are fetched and appended (infinite scroll).
 * 3. Users can view, edit, or delete documents.
 * 4. There’s a modal-based flow that allows for creating new question papers – either AI-generated
 *    or completely custom (manually built).
 * 5. When a document is viewed, the code fetches its HTML version from the server and displays it
 *    in a modal. A solution link can also be viewed if available.
 * 6. The entire file focuses on user-friendly UI interactions (accordions, modals, infinite scrolling).
 */

import React, { useState, useEffect, useCallback } from "react";
import { FileText, DownloadIcon } from "lucide-react";
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
 * Reusable styling classes for various buttons and input fields.
 */
const primaryButtonClass =
  "px-4 py-2 bg-black text-white font-semibold rounded-lg hover:bg-black transition-colors";
const commonButtonClass =
  "px-4 py-2 bg-black text-white font-semibold rounded hover:bg-black transition-colors";
const modalButtonClass =
  "p-2 bg-black text-white font-semibold rounded hover:bg-black";
const downloadButtonClass =
  "inline-flex items-center px-3 py-2 bg-black text-white font-semibold rounded-md hover:bg-black transition-colors";

/**
 * This component creates an accordion-based group of filter options for a particular filter category.
 * Each group can expand/collapse, and it displays a list of possible values to select.
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
      {/* Accordion header with label and toggle icon */}
      <div
        className="flex items-center justify-between cursor-pointer py-2 px-1"
        onClick={() => onToggleAccordion(filterKey)}
      >
        <h3 className="font-semibold text-base">{label}</h3>
        <span className="text-sm text-gray-600 select-none">
          {isOpen ? "▲" : "▼"}
        </span>
      </div>

      {/* If the accordion is open, render the list of filter values */}
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

/**
 * Main component: DocumentSidebar
 *
 * This component:
 * - Renders a fixed header with the title and "Create Question Paper" button.
 * - Renders a left filter sidebar (fixed below the header) and a right document list that is scrollable.
 * - Manages state for fetched documents, loading states, pagination, and modal dialogs.
 * - Handles creation of new question papers (both AI-generated and custom).
 * - Handles viewing (with a modal), editing, and deleting of question papers.
 * - Implements infinite scrolling to load more papers as the user scrolls.
 */
export const DocumentSidebar = () => {
  const navigate = useNavigate();

  // ----------------------------
  // Document and pagination state
  // ----------------------------
  const [documents, setDocuments] = useState([]);
  const [cursor, setCursor] = useState(undefined);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [infiniteLoading, setInfiniteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // New search query state

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    fetchDocuments(false);
  };

  // ----------------------------
  // Filter state
  // ----------------------------
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

  /**
   * Modals and dialogs:
   * - modalVisible: Controls visibility of the "View Document" modal.
   * - modalDocument: Holds the data for the document being viewed.
   * - modalActiveTab: Toggles between "question" and "solution" inside the viewing modal.
   * - showPaperDialog: Shows a prompt to choose between AI-generated or custom paper creation.
   * - showCustomCreateModal: After user selects "Custom Paper," open a form for name/grade/subject.
   */
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDocument, setModalDocument] = useState(null);
  const [modalActiveTab, setModalActiveTab] = useState("question");

  const [showPaperDialog, setShowPaperDialog] = useState(false);
  const [showCustomCreateModal, setShowCustomCreateModal] = useState(false);

  /**
   * Custom paper creation form state:
   * - customPaperName: Name for the new custom paper.
   * - customPaperGrade: Selected grade for the new custom paper.
   * - customPaperSubject: Selected subject for the new custom paper.
   * - errorMessage: Used to display validation errors to the user.
   */
  const [customPaperName, setCustomPaperName] = useState("");
  const [customPaperGrade, setCustomPaperGrade] = useState("");
  const [customPaperSubject, setCustomPaperSubject] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  /**
   * Toggling the visibility of the filter panel:
   * - showFilterPanel: Boolean that, if false, hides the entire filter sidebar.
   */
  const [showFilterPanel, setShowFilterPanel] = useState(true);

  /**
   * Accordion state for each filter group:
   * - openFilterGroups: object storing a boolean for whether each filter category is expanded.
   */

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

  // Attach the mousemove and mouseup event listeners when dragging
    /**
   * filterGroups: This array of objects maps each category's label, key, and possible values.
   * We iterate over these to create multiple FilterGroupAccordion components.
   */
  const filterGroups = [
    { label: "Grade", key: "grade", values: grades },
    { label: "Subject", key: "subject", values: subjects },
    { label: "Exam Day", key: "examDays", values: examDays },
    { label: "Exam Month", key: "examMonths", values: examMonths },
    { label: "Exam Year", key: "examYears", values: examYears },
    { label: "Shift", key: "shifts", values: shifts },
    { label: "Stream", key: "streams", values: streams },
    { label: "Exam Name", key: "examNames", values: examNames },
    { label: "Marks", key: "marks", values: marksOptions },
    { label: "Type", key: "types", values: types },
    // { label: "Difficulty", key: "difficulties", values: difficulties },
    // { label: "Question Type", key: "questionTypes", values: questionTypes },
  ];

  /**
   * toggleFilterValue: Helper function to add/remove a value in a multi-select filter category.
   *
   * For example, if a user clicks "Grade 10" in the "Grade" filter:
   *  - If "Grade 10" is not in the array, we add it.
   *  - If it is already selected, we remove it.
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
   * onToggleAccordion: Toggles the open/close state for a specific filter group's accordion.
   */
  const onToggleAccordion = (filterKey) => {
    setOpenFilterGroups((prev) => ({
      ...prev,
      [filterKey]: !prev[filterKey],
    }));
  };

  /**
   * fetchDocuments: Fetches the question papers from the server. It supports two modes:
   *  - isInitialLoad = true: Clear out old documents and fetch a fresh list.
   *  - isInitialLoad = false: Appends the next page of documents for infinite scrolling.
   *
   * The function uses the 'filters' state to build a request body for the server,
   * so the documents returned already match the selected filter criteria.
   */
  const fetchDocuments = async (isInitialLoad = false) => {
    // Distinguish between initial load and subsequent loads
    isInitialLoad ? setLoading(true) : setInfiniteLoading(true);
    try {
      // Prepare query parameters (limit, cursor for pagination)
      const queryParams = new URLSearchParams({
        limit: "10",
        ...(cursor && { cursor }),
      });

      // Prepare request body from filters
      const requestBody = {};
      if (filters.grade.length > 0) requestBody.grades = filters.grade;
      if (filters.subject.length > 0) requestBody.subjects = filters.subject;
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
      // if (filters.questionTypes.length > 0)
      //   requestBody.questionTypes = filters.questionTypes;
      requestBody.name = searchQuery;

      // Use an API call helper (postRequest) to fetch data
      const data = await postRequest(
        `${BASE_URL_API}/questionPaper/getPaginatedQuestionPapers?${queryParams.toString()}`,
        requestBody
      );

      // Check if API returned an error about the token; if so, reset local storage and navigate to login
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

      // If successful, update documents and pagination state
      if (data.success && data.questionPapers) {
        isInitialLoad
          ? setDocuments(data.questionPapers)
          : setDocuments((prev) => [...prev, ...data.questionPapers]);
        setHasNextPage(data.hasNextPage);
        setCursor(data.nextCursor);
      } else {
        if (isInitialLoad) setDocuments([]);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      if (isInitialLoad) setDocuments([]);
    } finally {
      isInitialLoad ? setLoading(false) : setInfiniteLoading(false);
    }
  };

  /**
   * Whenever the filters change, we reset pagination (cursor, hasNextPage, etc.)
   * and fetch the first batch of documents anew.
   */
  useEffect(() => {
    setDocuments([]);
    setCursor(undefined);
    setHasNextPage(true);
    fetchDocuments(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);


  /**
   * handleInfiniteScroll: This function runs on the window scroll event.
   * If the user scrolls near the bottom, we fetch the next page of documents (if available).
   */
  const handleInfiniteScroll = useCallback(() => {
    if (!hasNextPage || infiniteLoading || loading) return;
    const scrollThreshold = 300;
    const scrolledToBottom =
      window.innerHeight + window.scrollY >=
      document.body.offsetHeight - scrollThreshold;
    if (scrolledToBottom) fetchDocuments(false);
  }, [hasNextPage, infiniteLoading, loading, cursor]);

  // Attach scroll listener on mount and clean up on unmount
  useEffect(() => {
    window.addEventListener("scroll", handleInfiniteScroll);
    return () => window.removeEventListener("scroll", handleInfiniteScroll);
  }, [handleInfiniteScroll]);

  useEffect(() => {
    if (modalVisible) {
      // Disable scrolling on the background when modal is open
      document.body.style.overflow = "hidden";
    } else {
      // Enable scrolling again when modal is closed
      document.body.style.overflow = "auto";
    }

    // Cleanup: Reset the overflow when the component unmounts
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [modalVisible]);

  // ----------------------------
  // Helper functions for document actions
  // ----------------------------
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

  /**
   * handleCreatePaper: Triggered when the user clicks the "Create Question Paper" button.
   * It shows a dialog letting them choose between "AI-generated" or "Custom" question paper creation.
   */
  const handleCreatePaper = () => {
    setShowPaperDialog(true);
  };

  /**
   * handleCustomPaperClick: If the user chooses "Custom Paper," close the paper type dialog and open the custom paper creation modal.
   */
  const handleCustomPaperClick = () => {
    setShowPaperDialog(false);
    setShowCustomCreateModal(true);
  };

  /**
   * handleConfirmCustomPaper: Validates the custom paper form and creates a new paper via the API.
   * If successful, navigates to the custom question paper generation screen.
   */
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
      // Reset fields and close modal
      setShowCustomCreateModal(false);
      setCustomPaperName("");
      setCustomPaperGrade("");
      setCustomPaperSubject("");
    } catch (error) {
      console.error("Error creating custom paper:", error);
      setErrorMessage("Something went wrong while creating the paper.");
    }
  };

  /**
   * downloadAllSetPDFs: For a multi-set question paper, each set can have its own link.
   * This function opens each link, loads it, prints as a PDF, and then closes the window.
   *
   * The reason for multiple links is that the same question paper can have multiple versions
   * or sets for different sections / streams, etc.
   */
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

  /**
   * getDocumentName: Utility to prettify the document name by splitting underscores and capitalizing words.
   */
  const getDocumentName = ({ name }) => {
    const names = name.split("_");
    let capitalisedWords = names.map(
      (n) => n.charAt(0).toUpperCase() + n.slice(1)
    );
    return capitalisedWords.join(" ");
  };

  /**
   * getCapitalSubjectName: Utility to capitalize the subject name.
   */
  const getCapitalSubjectName = ({ subject }) => {
    return subject.charAt(0).toUpperCase() + subject.slice(1);
  };

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <div className="min-h-screen relative">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-20 bg-white shadow-md h-20 flex items-center px-4">
        {/* Header section with title and Create Question Paper button */}
        <h2 className="text-2xl font-semibold text-gray-800">Documents</h2>
        <div className="ml-auto">
          <button
            onClick={() => navigate("/question-bank")}
            className={`inline-flex items-center ${primaryButtonClass} mr-4`}
          >
            <FileText className="w-4 h-4 mr-2" />
            Question Bank
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

      {/* Main Content Container */}
      {/* Padding-top equal to header height (h-20) to avoid being overlapped */}
      <div className="flex pt-20">
        {/* Left Filter Panel (Fixed) */}
        {showFilterPanel && (
          <aside className="fixed top-20 left-0 w-64 h-[calc(100vh-80px)] border-r px-4 py-2 overflow-y-auto bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Filters</h2>
            
            </div>
            <div className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                placeholder="Search question papers..."
              />
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
            <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
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
            {/* Reset Filters Button */}
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
          </aside>
        )}

        {/* Right Document List Panel */}
        <main
          className={`flex-1 overflow-y-auto p-4 ${
            showFilterPanel ? "ml-64" : ""
          }`}
        >
          {/* Button to toggle filter sidebar visibility */}
          <div className="mb-4">
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="px-3 py-2 border rounded"
            >
              {showFilterPanel ? "Hide Filters" : "Show Filters"}
            </button>
          </div>
          {/* Main documents display area:
                1. Show a spinner if loading the initial set of documents.
                2. Otherwise, list the documents or show a "no results" message if empty. 
          */}
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
                          Grade {doc.grade} • Status :-{" "}
                          {doc.status.charAt(0).toUpperCase() +
                            doc.status.slice(1)}
                        </p>
                        {/* <p className="text-sm text-gray-500">
                          Created on{" "}
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </p> */}
                      </div>
                      <div className="flex gap-2">
                        {/* View Button */}
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
                        {/* Edit Button */}
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
                        {/* Delete Button */}
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
        </main>
      </div>

      {/* Modal for viewing a document (Question Paper or Answer Sheet) */}
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
              {/* DocumentViewer displays the HTML version of the document */}
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

      {/* Dialog for choosing between AI-generated or Custom Paper creation */}
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
    </div>
  );
};

export default DocumentSidebar;
