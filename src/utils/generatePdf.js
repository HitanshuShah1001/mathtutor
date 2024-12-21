import jsPDF from "jspdf";

function splitIntoTwoDocs(html) {
  // First <!DOCTYPE html> is presumably at the start, so skip it
  // Find the second occurrence:
  const secondDoctypeIndex = html.indexOf("<!DOCTYPE html", 1);
  if (secondDoctypeIndex === -1) {
    // If not found, return the entire string as one doc (or handle error)
    return [html];
  }
  const doc1 = html.slice(0, secondDoctypeIndex).trim();
  const doc2 = html.slice(secondDoctypeIndex).trim();

  // Ensure each part starts with <!DOCTYPE html>:
  const docs = [];
  docs.push(
    doc1.startsWith("<!DOCTYPE html>") ? doc1 : "<!DOCTYPE html>\n" + doc1
  );
  docs.push(
    doc2.startsWith("<!DOCTYPE html>") ? doc2 : "<!DOCTYPE html>\n" + doc2
  );
  return docs;
}


export async function handleGeneratePDFs(combinedHTML) {

  const [questionPaperHTML, answerKeyHTML] = splitIntoTwoDocs(combinedHTML);

  // 2) Create a PDF for the Question Paper
  const questionDoc = new jsPDF({
    unit: "pt", // "pt" = points
    format: "letter",
  });

  // .html() is asynchronous in modern jsPDF
  await questionDoc.html(questionPaperHTML, {
    x: 10,
    y: 10,
    width: 580, // content width in points
    windowWidth: 800, // approximate "browser" width for rendering
  });
  questionDoc.save("QuestionPaper.pdf");

  // 3) Create a PDF for the Answer Key
  const answerDoc = new jsPDF({
    unit: "pt",
    format: "letter",
  });

  await answerDoc.html(answerKeyHTML, {
    x: 10,
    y: 10,
    width: 580,
    windowWidth: 800,
  });
  answerDoc.save("AnswerKey.pdf");
}
