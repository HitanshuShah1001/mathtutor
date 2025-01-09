import React, { useState } from "react";
import { Download, Printer } from "lucide-react";

const DocumentViewer = ({ documentUrl, title }) => {
  const [loading, setLoading] = useState(true);

  const handlePrint = () => {
    const printWindow = window.open(documentUrl, "_blank");
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(documentUrl);
      const blob = await response.blob();
      const htmlContent = await blob.text();
        console.log(htmlContent)
      const element = document.createElement("div");
      element.innerHTML = htmlContent;

      const style = document.createElement("style");
      style.textContent = `
          body { font-family: Arial, sans-serif; }
          @page { margin: 1cm; }
        `;

      const printWindow = window.open("", "_blank");
      printWindow.document.head.appendChild(style);
      printWindow.document.body.appendChild(element);

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-13rem)] bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
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
          src={documentUrl}
          className="w-full h-full border-0"
          onLoad={() => setLoading(false)}
          title={title}
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
