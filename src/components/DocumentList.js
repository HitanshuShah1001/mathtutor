import React, { useState, useEffect } from "react";
import {
  FolderOpen,
  FileText,
  ChevronDown,
  Edit,
  DownloadIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChatHeader } from "../subcomponents/ChatHeader";
import { ACCESS_KEY, BASE_URL_API } from "../constants/constants";
import DocumentViewer from "./DocumentViewer";
import DocumentEditor from "./DocumentEditor";
import { removeDataFromLocalStorage } from "../utils/LocalStorageOps";
import { uploadToS3 } from "../utils/s3utils";

const GRADES = [7, 8, 9, 10];
const SUBJECTS = ["Maths", "Science", "English", "History"];

export const DocumentSidebar = () => {
  const [documents, setDocuments] = useState([]);
  const [editModeQuestion, setEditModeQuestion] = useState(false);
  const [editModeSolution, setEditModeSolution] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [activeDocument, setActiveDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    grade: null,
    subject: null,
  });

  const navigate = useNavigate();

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const requestBody = {};
      if (filters.grade) requestBody.grade = filters.grade;
      if (filters.subject) requestBody.subject = filters.subject;
      const accesskey = localStorage.getItem(ACCESS_KEY);

      const response = await fetch(
        `${BASE_URL_API}/questionPaper/getPaginatedQuestionPapers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: accesskey,
          },
          body: JSON.stringify(requestBody),
        }
      );
      const data = await response.json();

      if (data.message === "Invalid or expired access token") {
        removeDataFromLocalStorage();
      }
      setDocuments(data.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
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

  const FilterDropdowns = () => (
    <div className="mb-6 flex gap-4">
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
          {GRADES?.map((grade) => (
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
          {SUBJECTS?.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      </div>
    </div>
  );

  const downloadAllSetPDFs = (questionPapersLinks) => {
    questionPapersLinks.forEach((link, index) => {
      const anchor = document.createElement("a");
      anchor.href = link;
      anchor.download = `Set_${index + 1}.pdf`;
      anchor.click();
    });
  };

  if (loading && documents.length === 0) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (!loading && documents?.length === 0) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 rounded-lg bg-white shadow-lg max-w-md mx-auto border border-gray-100">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-50 rounded-full">
              <FolderOpen className="w-12 h-12 text-blue-500" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No Question Papers Found
          </h3>
          <p className="text-gray-500 mb-6">
            {filters.grade || filters.subject
              ? "Try adjusting your filters or create a new question paper."
              : "Get started by creating your first question paper."}
          </p>
          <button
            onClick={handleCreatePaper}
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
          >
            <FileText className="w-4 h-4 mr-2" />
            Create Question Paper
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ChatHeader />
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="w-1/4 min-h-screen bg-white border-r border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Documents</h2>
              <button
                onClick={handleCreatePaper}
                className="inline-flex items-center px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                <FileText className="w-4 h-4 mr-2" />
                New
              </button>
            </div>
          </div>

          <div className="overflow-y-auto">
            {documents?.map((doc) => (
              <div
                key={doc.id}
                onClick={() => {
                  setActiveDocument(null);
                  setSelectedDocument(doc);
                  setEditModeQuestion(false);
                  setEditModeSolution(false);
                }}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors duration-200 ${
                  selectedDocument?.id === doc.id
                    ? "bg-blue-50 border-l-4 border-l-blue-500"
                    : ""
                }`}
              >
                <div className="flex items-center space-x-3">
                  <FileText
                    className={`w-5 h-5 ${
                      selectedDocument?.id === doc.id
                        ? "text-blue-500"
                        : "text-gray-400"
                    }`}
                  />
                  <div className="flex-1">
                    <h3
                      className={`font-medium ${
                        selectedDocument?.id === doc.id
                          ? "text-blue-600"
                          : "text-gray-700"
                      }`}
                    >
                      {doc.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {doc.subject} • Grade {doc.grade}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 h-full">
          {/* Filters */}
          <FilterDropdowns />

          {selectedDocument ? (
            <div className="h-full">
              {/* 
                Hide this metadata block if viewing question or solution.
                i.e., only show if activeDocument is not 'question' or 'solution'.
              */}
              {!activeDocument && (
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    {selectedDocument.name}
                  </h2>
                  <p className="text-gray-500 mt-1">
                    {selectedDocument.subject} • Grade {selectedDocument.grade} •
                    Created on{" "}
                    {new Date(selectedDocument.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-gray-500 mt-1">
                    Topics: {JSON.stringify(selectedDocument.topics)}
                  </p>
                  <p className="text-gray-500 mt-1">
                    Total Sets:{" "}
                    {JSON.stringify(selectedDocument.numberOfSets) ?? 1}
                  </p>
                </div>
              )}

              {/* Tab Buttons */}
              <div className="flex gap-4 mb-6">
                <button
                  className={`px-6 py-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 shadow-sm group ${
                    activeDocument === "question"
                      ? "bg-blue-50 border-blue-500"
                      : ""
                  }`}
                  onClick={() => {
                    setActiveDocument("question");
                    // reset solution edit mode if switching tabs
                    setEditModeSolution(false);
                  }}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span className="font-medium text-gray-700 group-hover:text-blue-600">
                      Question Paper
                    </span>
                  </div>
                </button>

                <button
                  className={`px-6 py-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 shadow-sm group ${
                    activeDocument === "solution"
                      ? "bg-blue-50 border-blue-500"
                      : ""
                  }`}
                  onClick={() => {
                    setActiveDocument("solution");
                    // reset question edit mode if switching tabs
                    setEditModeQuestion(false);
                  }}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span className="font-medium text-gray-700 group-hover:text-blue-600">
                      Answer Sheet
                    </span>
                  </div>
                </button>

                <button
                  className="px-6 py-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 shadow-sm group"
                  onClick={() =>
                    downloadAllSetPDFs(selectedDocument.questionPapersLinks)
                  }
                >
                  <div className="flex items-center justify-center space-x-2">
                    <DownloadIcon className="w-5 h-5 text-blue-500" />
                    <span className="font-medium text-gray-700 group-hover:text-blue-600">
                      Download All Sets
                    </span>
                  </div>
                </button>
              </div>

              {/* Document content area */}
              {activeDocument === "question" && (
                <div>
                  {selectedDocument.questionPaperLink ? (
                    <>
                      {/* Toolbar: Edit toggle */}
                      <div className="flex items-center gap-4 mb-4">
                        <button
                          onClick={() => setEditModeQuestion(!editModeQuestion)}
                          className="flex items-center px-3 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          {editModeQuestion ? "View" : "Edit"}
                        </button>
                      </div>

                      {editModeQuestion ? (
                        <DocumentEditor
                          documentUrl={selectedDocument.questionPaperLink}
                          onSave={(updatedHTML) => {
                            uploadToS3(
                              updatedHTML,
                              selectedDocument.questionPaperLink
                            )
                              .then(() => {
                                window.location.reload();
                              })
                              .catch((err) => {
                                alert("Error updating document");
                              });
                          }}
                        />
                      ) : (
                        <DocumentViewer
                          documentUrl={selectedDocument.questionPaperLink}
                          title={`${selectedDocument.name} - Question Paper`}
                        />
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <p className="text-gray-500">
                        {selectedDocument.status === "inProgress"
                          ? "Document is still being generated..."
                          : "Question paper not available"}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeDocument === "solution" && (
                <div>
                  {selectedDocument.solutionLink ? (
                    <>
                      {/* Toolbar: Edit toggle */}
                      <div className="flex items-center gap-4 mb-4">
                        <button
                          onClick={() => setEditModeSolution(!editModeSolution)}
                          className="flex items-center px-3 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          {editModeSolution ? "View" : "Edit"}
                        </button>
                      </div>

                      {editModeSolution ? (
                        <DocumentEditor
                          documentUrl={selectedDocument.solutionLink}
                          onSave={(updatedHTML) => {
                            uploadToS3(
                              updatedHTML,
                              selectedDocument.solutionLink
                            )
                              .then(() => {
                                window.location.reload();
                              })
                              .catch((err) => {
                                alert("Error updating document");
                              });
                          }}
                        />
                      ) : (
                        <DocumentViewer
                          documentUrl={selectedDocument.solutionLink}
                          title={`${selectedDocument.name} - Answer Sheet`}
                        />
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <p className="text-gray-500">
                        {selectedDocument.status === "inProgress"
                          ? "Document is still being generated..."
                          : "Solution not available"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div
              className="h-full flex items-center justify-center text-gray-500"
              style={{ height: "80vh" }}
            >
              Select a document to view details
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DocumentSidebar;
