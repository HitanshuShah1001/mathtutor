import { styles } from "../Questionpaperstyles";
import { QuestionPaper } from "./RenderQuestionPaper";
import { generatePDF } from "../utils/generatePdf";

export const GenerateQuestionPaperAndDownloadPdf = ({ responseText }) => (
  <div style={styles.resultContainer}>
    <h2 style={styles.resultTitle}>Generated Question Paper</h2>
    {responseText && <QuestionPaper htmlContent={responseText} />}

    <button
      style={styles.downloadButton}
      onClick={() => generatePDF(responseText)}
    >
      Download PDF
    </button>
  </div>
);
