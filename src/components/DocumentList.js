import React, { useState, useEffect } from "react";
import { FileText, ChevronDown, DownloadIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BASE_URL_API } from "../constants/constants";
import DocumentViewer from "./DocumentViewer";
import { removeDataFromLocalStorage } from "../utils/LocalStorageOps";
import { deleteRequest, postRequest } from "../utils/ApiCall";

/**
 * Available Grades & Subjects for demonstration
 */
const GRADES = [7, 8, 9, 10];
const SUBJECTS = ["Maths", "Science", "English", "History"];

/**
 * Common CSS classes for styling
 */
const primaryButtonClass =
  "px-4 py-2 bg-[#000] text-white font-semibold rounded-lg hover:bg-[#000] transition-colors";
const commonButtonClass =
  "px-4 py-2 bg-[#000] text-white font-semibold rounded hover:bg-[#000] transition-colors";
const modalButtonClass =
  "p-2 bg-[#000] text-white font-semibold rounded hover:bg-[#000]";
const downloadButtonClass =
  "inline-flex items-center px-3 py-2 bg-[#000] text-white font-semibold rounded-md hover:bg-[#000] transition-colors";
const selectClass =
  "appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-black font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
const dropdownIconClass =
  "absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none";

export const DocumentSidebar = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    grade: null,
    subject: null,
  });

  // Modal-related states for Document View
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDocument, setModalDocument] = useState(null);
  const [modalActiveTab, setModalActiveTab] = useState("question");

  // Dialog for deciding AI vs Custom
  const [showPaperDialog, setShowPaperDialog] = useState(false);

  // SECOND MODAL: For creating a Custom Paper with name, grade, subject
  const [showCustomCreateModal, setShowCustomCreateModal] = useState(false);

  // States to hold user input for new custom question paper
  const [customPaperName, setCustomPaperName] = useState("");
  const [customPaperGrade, setCustomPaperGrade] = useState("");
  const [customPaperSubject, setCustomPaperSubject] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  /**
   * Helper: fetch HTML link for a question paper
   */
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
   * Fetch all documents (question papers) for the user
   */
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const requestBody = {};
      if (filters.grade) requestBody.grade = filters.grade;
      if (filters.subject) requestBody.subject = filters.subject;

      const data = await postRequest(
        `${BASE_URL_API}/questionPaper/getPaginatedQuestionPapers?limit=10000`,
        requestBody
      );

      if (data.message) {
        if (
          data.message === "Invalid or expired access token" ||
          data.message === "Access token is required"
        ) {
          // Token invalid: remove local data, navigate to login
          navigate("/login");
          removeDataFromLocalStorage();
        }
      }

      if (data.success && data.questionPapers) {
        setDocuments(data.questionPapers);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * On initial mount or when filters change, fetch documents
   */
  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  /**
   * Instead of direct navigation, open a simple dialog (AI or Custom)
   */
  const handleCreatePaper = () => {
    setShowPaperDialog(true);
  };

  /**
   * When user chooses "Custom Paper" from the first dialog:
   * Close the AI vs Custom dialog, open the form modal for Name, Grade, Subject.
   */
  const handleCustomPaperClick = () => {
    setShowPaperDialog(false);
    setShowCustomCreateModal(true);
  };

  /**
   * On confirm, validate required fields, call the API, then navigate
   */
  const handleConfirmCustomPaper = async () => {
    // Validate
    if (!customPaperName || !customPaperGrade || !customPaperSubject) {
      setErrorMessage("All three fields are required.");
      return;
    }

    // Clear error
    setErrorMessage("");

    try {
      const body = {
        name: customPaperName,
        grade: Number(customPaperGrade),
        subject: customPaperSubject,
      };

      // Suppose the backend endpoint for creating a paper is:
      //    POST /questionPaper/create
      // returning { success: boolean, questionPaperId: number }
      // Adjust as needed for your actual endpoint
      const url = `${BASE_URL_API}/questionPaper/create`;
      const response = await postRequest(url, body);
      console.log(response);
      if (response.id) {
        // Navigate to custom question paper route, passing the new ID
        navigate("/custom-question-paper-generation", {
          state: { questionPaperId: response.id },
        });
      } else {
        setErrorMessage(response?.message || "Failed to create paper.");
      }
      // Close the form modal
      setShowCustomCreateModal(false);
      // Reset form fields
      setCustomPaperName("");
      setCustomPaperGrade("");
      setCustomPaperSubject("");
    } catch (error) {
      console.error("Error creating custom paper:", error);
      setErrorMessage("Something went wrong while creating the paper.");
    }
  };

  /**
   * Filter dropdowns for selecting grade & subject
   */
  const FilterDropdowns = () => (
    <div className="mb-6 flex items-center gap-4">
      <div className="relative">
        <select
          value={filters.grade || ""}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              grade: e.target.value ? Number(e.target.value) : null,
            }))
          }
          className={selectClass}
        >
          <option value="">All Grades</option>
          {GRADES.map((grade) => (
            <option key={grade} value={grade}>
              Grade {grade}
            </option>
          ))}
        </select>
        <ChevronDown className={dropdownIconClass} />
      </div>

      <div className="relative">
        <select
          value={filters.subject || ""}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              subject: e.target.value || null,
            }))
          }
          className={selectClass}
        >
          <option value="">All Subjects</option>
          {SUBJECTS.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
        <ChevronDown className={dropdownIconClass} />
      </div>

      <button
        onClick={() => navigate("/question-bank")}
        className={`top-1/2 ${primaryButtonClass}`}
        style={{ height: "41px" }}
      >
        Question Bank
      </button>
    </div>
  );

  /**
   * Helper function to download/print multiple PDFs for all sets in a question paper
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
   * Utility to transform doc name from "abc_xyz" => "Abc Xyz"
   */
  const getDocumentName = ({ name }) => {
    const names = name.split("_");
    let capitalisedWords = names.map(
      (n) => n.charAt(0).toUpperCase() + n.slice(1)
    );
    return capitalisedWords.join(" ");
  };

  /**
   * Utility to capitalize subject
   */
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

        <FilterDropdowns />

        {/* Document list */}
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="ml-4 text-gray-600">Loading documents...</p>
          </div>
        ) : (
          <div>
            {documents?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No question papers found. Adjust your filters or create a new
                  question paper.
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
                            fetchDocuments();
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
              </div>
            )}
          </div>
        )}
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
              {/* Modal Tabs */}
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

              {/* Document Viewer */}
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

      {/* 1) AI vs Custom Paper Choice Dialog */}
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
              {/* AI Option */}
              <button
                className={commonButtonClass}
                onClick={() => {
                  navigate("/question-paper-generation");
                  setShowPaperDialog(false);
                }}
              >
                AI-generated
              </button>
              {/* Custom Option */}
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

      {/* 2) Custom Paper Creation Modal */}
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

              {/* Paper Name */}
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

              {/* Grade Selection */}
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
                  {GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Selection */}
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
                  {SUBJECTS.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              {/* Confirm Button */}
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
