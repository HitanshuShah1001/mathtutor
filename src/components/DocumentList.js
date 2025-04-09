import React, { useState, useEffect, useCallback, useRef } from "react";
import { FileText, DownloadIcon, Edit, Check, X } from "lucide-react";
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
  marksOptions,
  types,
  BASE_URL_API,
  INVALID_TOKEN,
} from "../constants/constants";
import DocumentViewer from "./DocumentViewer";
import { removeDataFromLocalStorage } from "../utils/LocalStorageOps";
import { deleteRequest, postRequest } from "../utils/ApiCall";
import {
  CreatePaperButton,
  ProfileMenuButton,
  QuestionBankButton,
} from "./QuestionBankButton";

/**
 * Reusable styling classes for various buttons and input fields.
 */
export const primaryButtonClass =
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
                    ? "bg-black text-white"
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
  const documentListRef = useRef(null);

  // Document and pagination state
  const [documents, setDocuments] = useState([]);
  const [cursor, setCursor] = useState(undefined);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [infiniteLoading, setInfiniteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

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
  const [totalSets, setTotalSets] = useState(1);

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
  ];

  /**
   * toggleFilterValue: Helper function to add/remove a value in a multi-select filter category.
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

  const onToggleAccordion = (filterKey) => {
    setOpenFilterGroups((prev) => ({
      ...prev,
      [filterKey]: !prev[filterKey],
    }));
  };

  /**
   * fetchDocuments: Fetches the question papers from the server with pagination.
   *
   * If isInitialLoad=true, we fetch the first page (cursor omitted).
   * If isInitialLoad=false, we must have a valid customCursor to fetch next pages.
   */

  const fetchDocuments = async (isInitialLoad = false, customCursor) => {
    if (!isInitialLoad && (!customCursor || customCursor === null)) {
      return;
    }

    isInitialLoad ? setLoading(true) : setInfiniteLoading(true);
    try {
      const queryParams = new URLSearchParams({
        limit: "10",
        ...(typeof customCursor !== "undefined" && { cursor: customCursor }),
      });

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
      if (filters.difficulties.length > 0) {
        requestBody.difficulties = filters.difficulties.map((d) =>
          d.toLowerCase()
        );
      }

      const data = await postRequest(
        `${BASE_URL_API}/questionPaper/getPaginatedQuestionPapers?${queryParams.toString()}`,
        requestBody
      );

      if (data.message) {
        if (data.message === INVALID_TOKEN) {
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
        if (isInitialLoad) {
          setDocuments([]);
        }
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      if (isInitialLoad) {
        setDocuments([]);
      }
    } finally {
      isInitialLoad ? setLoading(false) : setInfiniteLoading(false);
    }
  };

  useEffect(() => {
    setDocuments([]);
    setCursor(undefined);
    setHasNextPage(true);
    fetchDocuments(true, undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  /**
   * checkIfMoreDocumentsNeeded: This function checks if the viewport is larger than the content
   * and loads more documents if needed.
   */
  const checkIfMoreDocumentsNeeded = useCallback(() => {
    if (!hasNextPage || infiniteLoading || loading) return;

    if (documentListRef.current) {
      const documentListHeight = documentListRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      const headerHeight = 80;

      // If the document list doesn't fill the viewport (with some buffer),
      // and we have more documents, fetch the next page.
      if (
        documentListHeight < viewportHeight - headerHeight - 10 &&
        hasNextPage
      ) {
        fetchDocuments(false, cursor);
      }
    }
  }, [hasNextPage, infiniteLoading, loading, cursor]);

  /**
   * handleInfiniteScroll: This function runs on the window scroll event.
   * If the user scrolls near the bottom, we fetch the next page of documents (if available).
   */
  const handleInfiniteScroll = useCallback(() => {
    if (!hasNextPage || infiniteLoading || loading || !cursor) return;
    const scrollThreshold = 300;
    const scrolledToBottom =
      window.innerHeight + window.scrollY >=
      document.body.offsetHeight - scrollThreshold;
    if (scrolledToBottom) {
      fetchDocuments(false, cursor);
    }
  }, [hasNextPage, infiniteLoading, loading, cursor]);

  /**
   * After each load of documents, we check if there's enough vertical space on the screen.
   * If not, we load more (if available).
   */
  useEffect(() => {
    checkIfMoreDocumentsNeeded();
    window.addEventListener("resize", checkIfMoreDocumentsNeeded);
    return () =>
      window.removeEventListener("resize", checkIfMoreDocumentsNeeded);
  }, [documents, checkIfMoreDocumentsNeeded]);

  useEffect(() => {
    window.addEventListener("scroll", handleInfiniteScroll);
    return () => window.removeEventListener("scroll", handleInfiniteScroll);
  }, [handleInfiniteScroll]);

  useEffect(() => {
    if (modalVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [modalVisible]);

  // -----
  // NEW: Inline Editing States and Functions for updating document name
  const [editingDocId, setEditingDocId] = useState(null);
  const [editedName, setEditedName] = useState("");

  const handleEditIconClick = (doc) => {
    setEditingDocId(doc.id);
    setEditedName(doc.name);
  };

  const updateQuestionPaperName = async (id, newName) => {
    // Stub function: Integrate your API call later
    const url = `${BASE_URL_API}/questionpaper/changeQuestionPapername`;
    const body = { id, name: newName };
    const res = await postRequest(url,body);
    return res
  };

  const handleSaveName = async (id) => {
    try {
      const result = await updateQuestionPaperName(id, editedName);
      if (result.success) {
        setDocuments((prevDocs) =>
          prevDocs.map((d) => (d.id === id ? { ...d, name: editedName } : d))
        );
        setEditingDocId(null);
        setEditedName("");
        fetchDocuments(true,undefined);
      } else {
        alert("Error saving changes.");
      }
    } catch (error) {
      console.error("Error updating name:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingDocId(null);
    setEditedName("");
  };
  // -----

  const getHtmlLink = async (questionPaperId) => {
    const url = `${BASE_URL_API}/questionpaper/generateHtml`;
    const body = { questionPaperId };
    try {
      const result = await postRequest(url, body);
      return result?.questionPaper;
    } catch (error) {
      console.error("Error generating HTML:", error);
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
          state: {
            questionPaperId: response.id,
            name: customPaperName,
            grade: customPaperGrade,
            subject: customPaperSubject,
            numberOfSets: 1,
          },
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
    <div className="min-h-screen relative">
      <header className="fixed top-0 left-0 right-0 z-20 bg-white shadow-md h-20 flex items-center px-4">
        <h2 className="text-2xl font-semibold text-gray-800">Documents</h2>
        <div className="ml-auto flex items-center">
          <QuestionBankButton />
          <CreatePaperButton onClick={handleCreatePaper} />
          <ProfileMenuButton />
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
                    className="inline-flex items-center px-3 py-1 mr-2 mb-2 bg-black text-white rounded-full text-sm"
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

        <main
          className={`flex-1 overflow-y-auto p-4 ${
            showFilterPanel ? "ml-64" : ""
          }`}
        >
          <div className="mb-4 flex items-center gap-4">
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
            <div ref={documentListRef}>
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
                        {/* Inline Editing for Document Name */}
                        {editingDocId === doc.id ? (
                          <div className="flex items-center">
                            <input
                              type="text"
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              className="text-lg font-medium text-gray-800 border rounded p-1"
                            />
                            <button
                              onClick={() => handleSaveName(doc.id)}
                              className="ml-2"
                            >
                              <Check className="w-5 h-5 text-green-600" />
                            </button>
                            <button onClick={handleCancelEdit} className="ml-2">
                              <X className="w-5 h-5 text-red-600" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <h3 className="text-lg font-medium text-gray-800">
                              {getDocumentName({ name: doc.name })}
                            </h3>
                            <button
                              onClick={() => handleEditIconClick(doc)}
                              className="ml-2"
                            >
                              <Edit className="w-5 h-5 text-gray-600 hover:text-gray-800" />
                            </button>
                          </div>
                        )}
                        <p className="text-sm text-gray-500">
                          {getCapitalSubjectName({ subject: doc.subject })} •
                          Grade {doc.grade} • Status:{" "}
                          {doc.status.charAt(0).toUpperCase() +
                            doc.status.slice(1)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            try {
                              const docWithQuestionAndSolutionLink =
                                await getHtmlLink(doc.id);
                              setModalDocument(docWithQuestionAndSolutionLink);
                              setModalActiveTab("question");
                              setModalVisible(true);
                            } catch (e) {
                              console.error("Error loading document:", e);
                            }
                          }}
                          className={`${commonButtonClass} ${
                            doc.type === "archive" ? "w-full" : ""
                          }`}
                        >
                          View
                        </button>
                        {doc.type !== "archive" && (
                          <>
                            {/* <button
                              onClick={async () => {
                                if (
                                  window.confirm(
                                    "Are you sure you want to delete this paper?"
                                  )
                                ) {
                                  try {
                                    await deleteRequest(
                                      `${BASE_URL_API}/questionPaper/${doc.id}`
                                    );
                                    // After deleting, reset and fetch again
                                    setDocuments([]);
                                    setCursor(undefined);
                                    setHasNextPage(true);
                                    fetchDocuments(true);
                                  } catch (error) {
                                    console.error(
                                      "Error deleting paper:",
                                      error
                                    );
                                  }
                                }
                              }}
                              className={commonButtonClass}
                            >
                              Delete
                            </button> */}
                            <button
                              onClick={() => {
                                if (doc.sections && doc.sections.length > 0) {
                                  navigate(`/edit-document/${doc.id}`, {
                                    state: {
                                      sections: doc.sections,
                                      docName: doc.name,
                                      grade: doc.grade,
                                      subject: doc.subject,
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
                          </>
                        )}
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

      {modalVisible && modalDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white w-11/12 h-[90vh] rounded-lg shadow-xl relative flex flex-col">
            <button
              onClick={() => setModalVisible(false)}
              className={`absolute top-4 right-4 ${modalButtonClass}`}
            >
              Close
            </button>
            <div className="p-4 flex flex-col h-full">
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
              <div className="flex-1 overflow-auto h-0 min-h-0">
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
                  {grades?.map((g) => (
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
                  {subjects?.map((sub) => (
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
