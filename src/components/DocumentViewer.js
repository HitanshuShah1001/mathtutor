import React, { useState } from "react";
import { Download, Printer } from "lucide-react";

const DocumentViewer = ({ documentUrl, name }) => {
  const [loading, setLoading] = useState(true);
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
      console.log(htmlContent, "html content that was received");
      // Open a new window and write the full HTML content into it.
      const printWindow = window.open("", "_blank");
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // When the new window finishes loading, wait for MathJax to typeset the math.
      printWindow.onload = () => {
        if (printWindow.MathJax && printWindow.MathJax.typesetPromise) {
          // Wait until MathJax finishes rendering all math
          printWindow.MathJax.typesetPromise()
            .then(() => {
              printWindow.print();
              printWindow.close();
            })
            .catch((err) => {
              console.error("Error during MathJax typesetting:", err);
              // Fallback: attempt to print even if typesetting fails
              printWindow.print();
              printWindow.close();
            });
        } else {
          // Fallback if MathJax is not available: wait a bit longer.
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
    <div className="flex flex-col h-[calc(100vh-13rem)] bg-white rounded-lg shadow-sm border border-gray-200">
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

export default DocumentViewer;
