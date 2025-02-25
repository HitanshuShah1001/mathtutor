import React, { useState, useEffect } from "react";
import { FileText, ChevronDown, DownloadIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BASE_URL_API } from "../constants/constants";
import DocumentViewer from "./DocumentViewer";
import { removeDataFromLocalStorage } from "../utils/LocalStorageOps";
import { postRequest } from "../utils/ApiCall";

const GRADES = [7, 8, 9, 10];
const SUBJECTS = ["Maths", "Science", "English", "History"];

export const DocumentSidebar = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    grade: null,
    subject: null,
  });

  // Modal-related states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDocument, setModalDocument] = useState(null);
  const [modalActiveTab, setModalActiveTab] = useState("question");

  const navigate = useNavigate();

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

      console.log("Data that was received", data);

      // If the API sends a message indicating invalid token, handle it
      if (data.message) {
        if (
          data.message === "Invalid or expired access token" ||
          data.message === "Access token is required"
        ) {
          console.log('in here')
          navigate('/login');
          removeDataFromLocalStorage();
        }
      }

      // Safely set the documents from the new structure
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

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleCreatePaper = () => {
    navigate("/question-paper-generation");
  };

  // Dropdown Filters + "Question Bank" Chip
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
          className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Grades</option>
          {GRADES.map((grade) => (
            <option key={grade} value={grade}>
              Grade {grade}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
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
          className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Subjects</option>
          {SUBJECTS.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      </div>

      <button
        onClick={() => navigate("/question-bank")}
        className="py-2 px-4 top-1/2 rounded-lg bg-green-100 text-green-700 text-m font-medium hover:bg-green-200 transition-colors"
        style={{ height: "41px" }}
      >
        Question Bank
      </button>
    </div>
  );

  // Helper function to download/print multiple PDFs (for all sets)
  const downloadAllSetPDFs = async (links) => {
    for (let index = 0; index < links?.length; index++) {
      const link = links[index];
      try {
        // Open a new window synchronously
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          alert("Popup blocked. Please allow pop-ups for this site.");
          return;
        }
        // Fetch the HTML content
        const response = await fetch(link);
        const htmlContent = await response.text();

        // Write the HTML content into the new window
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Wait until the window loads and possibly MathJax is typeset
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
              // Fallback if MathJax isn't present
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

  return (
    <>
      <div className="p-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Documents</h2>
          <button
            onClick={handleCreatePaper}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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
                        {doc.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {doc.subject} • Grade {doc.grade}
                      </p>
                      <p className="text-sm text-gray-500">
                        Created on{" "}
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Check if paper is fully generated or not */}
                    {doc.questionPaperLink && doc.solutionLink ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setModalDocument(doc);
                            setModalActiveTab("question");
                            setModalVisible(true);
                          }}
                          className="px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                        >
                          View
                        </button>
                        {/* Inside the map for each document */}
                        <button
                          onClick={() => {
                            if (doc.sections && doc.sections.length > 0) {
                              // Navigate to the edit page. You could pass the document ID
                              // as a route param or pass the entire doc in route state.
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
                          className="px-4 py-2 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 transition-colors"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            alert("Delete functionality not implemented yet")
                          }
                          className="px-4 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <span className="px-4 py-2 bg-blue-50 text-gray-600 rounded transition-colors">
                          Paper generation in progress.
                        </span>
                      </div>
                    )}
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
              className="absolute top-4 right-4 p-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Close
            </button>
            <div className="p-4">
              {/* Tabs */}
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setModalActiveTab("question")}
                  className={`px-4 py-2 rounded ${
                    modalActiveTab === "question"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-gray-50 text-gray-600"
                  }`}
                >
                  Question Paper
                </button>
                <button
                  onClick={() => setModalActiveTab("solution")}
                  className={`px-4 py-2 rounded ${
                    modalActiveTab === "solution"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-gray-50 text-gray-600"
                  }`}
                >
                  Answer Sheet
                </button>

                {modalActiveTab === "question" &&
                  modalDocument?.questionPapersLinks?.length > 0 && (
                    <button
                      onClick={() =>
                        downloadAllSetPDFs(modalDocument.questionPapersLinks)
                      }
                      className="inline-flex items-center px-3 py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors"
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
    </>
  );
};

export default DocumentSidebar;
