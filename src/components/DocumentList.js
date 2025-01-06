import React, { useState, useEffect } from "react";
import { FolderOpen, FileText, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChatHeader } from "../subcomponents/ChatHeader";
import { DUMMY_DOCUMENTS } from "../constants/constants";

const fetchDocuments = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(DUMMY_DOCUMENTS);
    }, 1000);
  });
};

export const DocumentSidebar = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments().then((data) => setDocuments(data));
  }, []);

  const handleCreatePaper = () => {
    navigate("/question-paper-generation");
  };

  if (documents.length === 0) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 rounded-lg bg-white shadow-lg max-w-md mx-auto border border-gray-100">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-50 rounded-full">
              <FolderOpen className="w-12 h-12 text-blue-500" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No Question Papers Yet
          </h3>
          <p className="text-gray-500 mb-6">
            Get started by creating your first question paper. Click the button
            below to begin.
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
                      {doc.subject} • {doc.grade}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {selectedDocument ? (
            <div className="h-full">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                  {selectedDocument.title}
                </h2>
                <p className="text-gray-500 mt-1">
                  {selectedDocument.subject} • {selectedDocument.grade} •
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
