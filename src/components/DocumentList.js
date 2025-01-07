import React, { useState, useEffect } from "react";
import { FolderOpen, FileText, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChatHeader } from "../subcomponents/ChatHeader";
import { ACCESS_KEY, BASE_URL_API, DUMMY_DOCUMENTS } from "../constants/constants";

const GRADES = [7, 8, 9, 10];
const SUBJECTS = ["Maths", "Science", "English", "History"];

export const DocumentSidebar = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
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
      const accesskey = localStorage.getItem(ACCESS_KEY)
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
      setDocuments(data);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setDocuments(DUMMY_DOCUMENTS);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
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
    </div>
  );

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

  if (!loading && documents.length === 0) {
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
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => setSelectedDocument(doc)}
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
        <div className="flex-1 p-4">
          <FilterDropdowns />

          {selectedDocument ? (
            <div className="h-full">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                  {selectedDocument.title}
                </h2>
                <p className="text-gray-500 mt-1">
                  {selectedDocument.subject} • Grade {selectedDocument.grade} •
                  Created on{" "}
                  {new Date(selectedDocument.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  className="px-6 py-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 shadow-sm group"
                  onClick={() => {}}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span className="font-medium text-gray-700 group-hover:text-blue-600">
                      Question Paper
                    </span>
                  </div>
                </button>

                <button
                  className="px-6 py-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 shadow-sm group"
                  onClick={() => {}}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span className="font-medium text-gray-700 group-hover:text-blue-600">
                      Answer Sheet
                    </span>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Select a document to view details
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DocumentSidebar;
