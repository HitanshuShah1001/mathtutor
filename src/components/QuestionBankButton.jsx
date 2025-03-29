import { useNavigate } from "react-router-dom";
import { primaryButtonClass } from "./DocumentList";
import { FileText } from "lucide-react";

export const QuestionBankButton = () => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/question-bank")}
      className={`inline-flex items-center ${primaryButtonClass} mr-4`}
    >
      <FileText className="w-4 h-4 mr-2" />
      Question Bank
    </button>
  );
};

export const CreatePaperButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center ${primaryButtonClass}`}
    >
      <FileText className="w-4 h-4 mr-2" />
      Create Question Paper
    </button>
  );
};
