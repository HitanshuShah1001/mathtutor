import { useNavigate } from "react-router-dom";
import { primaryButtonClass } from "./DocumentList";
import { FileText } from "lucide-react";
import ProfileMenu from "../subcomponents/ProfileMenu";

export const QuestionBankButton = () => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/question-bank")}
      className={`inline-flex items-center ${primaryButtonClass} mr-4`}
    >
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
      Create Question Paper
    </button>
  );
};

export const QuestionPapersButton = () => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/question-paper-list")}
      className={`inline-flex items-center ${primaryButtonClass} mr-4`}
    >
      Question Papers
    </button>
  );
};

export const ProfileMenuButton = () => {
  return (
    <div style={{ marginLeft: "10px" }}>
      <ProfileMenu />
    </div>
  );
};
