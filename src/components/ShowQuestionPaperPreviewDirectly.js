import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Download, Printer } from "lucide-react";

// DocumentViewer Component
const DocumentViewer = ({ documentUrl, name }) => {
  const [loading, setLoading] = useState(true);
  // Append a timestamp to bust caching.
  const uniqueDocumentUrl = `${documentUrl}?t=${Date.now()}`;

  const handlePrint = () => {
    const printWindow = window.open(documentUrl, "_blank");
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const handleDownloadPDF = async () => {
    try {
      // Fetch the complete HTML content (which should include <head> and the MathJax script)
      const response = await fetch(documentUrl);
      const htmlContent = await response.text();
      // This setTimeout is not functional here—adjust as needed if you require a delay.
      setTimeout(() => {}, 5000);
      // Open a new window and write the full HTML content into it.
      const printWindow = window.open("", "_blank");
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // When the new window finishes loading, wait for MathJax to typeset the math.
      printWindow.onload = () => {
        if (printWindow.MathJax && printWindow.MathJax.typesetPromise) {
          // Wait until MathJax finishes rendering all math.
          printWindow.MathJax.typesetPromise()
            .then(() => {
              printWindow.print();
              printWindow.close();
            })
            .catch((err) => {
              console.error("Error during MathJax typesetting:", err);
              // Fallback: attempt to print even if typesetting fails.
              printWindow.print();
              printWindow.close();
            });
        } else {
          // Fallback if MathJax is not available: wait a short moment.
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 500);
        }
      };
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-3 py-2 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </button>
        </div>
      </div>
      <div className="flex-1 p-4 h-full">
        <iframe
          src={uniqueDocumentUrl}
          className="w-full h-full border-0"
          onLoad={() => setLoading(false)}
          title={name}
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
};

// Download all sets function
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

// API call function to get the HTML links.
const BASE_URL_API = "https://your-api-domain.com";
const getHtmlLink = async (questionPaperId) => {
  const url = `${BASE_URL_API}/questionpaper/generateHtml`;
  const body = { questionPaperId };
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    return result?.questionPaper;
  } catch (error) {
    console.error("Error generating HTML:", error);
    throw error;
  }
};

// CSS class variables – adjust these as needed.
const commonButtonClass = "px-4 py-2 bg-blue-500 text-white rounded";
const modalButtonClass = "px-2 py-1 bg-red-500 text-white rounded";
const downloadButtonClass =
  "flex items-center px-4 py-2 bg-green-500 text-white rounded";

// Main component that automatically loads the document and shows the modal.
const QuestionPaperModal = () => {
  const { questionPaperId } = useParams();
  const [modalDocument, setModalDocument] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalActiveTab, setModalActiveTab] = useState("question");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // On mount, call the API using the questionPaperId from the URL.
  useEffect(() => {
    if (!questionPaperId) return;
    const loadDocument = async () => {
      try {
        const docWithQuestionAndSolutionLink = await getHtmlLink(
          questionPaperId
        );
        setModalDocument(docWithQuestionAndSolutionLink);
        setModalActiveTab("question");
        setModalVisible(true);
      } catch (err) {
        console.error("Error loading document:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    loadDocument();
  }, [questionPaperId]);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error.message}</div>;
  }

  return (
    <>
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
                      <Download className="w-4 h-4 mr-2" />
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
    </>
  );
};

export default QuestionPaperModal;
