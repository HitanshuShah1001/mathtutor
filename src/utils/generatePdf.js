import html2canvas from "html2canvas";
import { jsPDF } from "jspdf"; // Import jsPDF


export const generatePDF = (responseText) => {
    // Create a temporary container for the HTML content.
    // This ensures that the element can be rendered properly, including external CSS.
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "fixed";
    tempContainer.style.top = "-9999px"; // Hide off-screen
    tempContainer.style.left = "-9999px";
    tempContainer.style.fontSize = "18px"; // Incre
    tempContainer.innerHTML = responseText;
    document.body.appendChild(tempContainer);
  
    // Use html2canvas to capture the rendered HTML element as a canvas
    html2canvas(tempContainer, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "pt", "a4");
  
      // Calculate image dimensions to fit into A4 size
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("Question_Paper.pdf");
  
      // Clean up after generating the PDF
      document.body.removeChild(tempContainer);
    });
  }; 