import { Plus } from "lucide-react";
import { CustomLoader } from "../components/Loader";

export const LoaderWrapper = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-white bg-opacity-30">
      <CustomLoader />
    </div>
  );
};

export const PreviewButton = ({ handlePreviewClick }) => {
  return (
    <button
      onClick={handlePreviewClick}
      className="px-4 py-2 bg-black text-white font-semibold rounded hover:bg-gray-800 transition-colors"
    >
      Preview
    </button>
  );
};

export const AddQuestionForSection = ({
  handleAddQuestionForSection,
  section,
}) => {
  return (
    <button
      onClick={() => handleAddQuestionForSection(section.name)}
      className="p-2 rounded bg-black text-white flex items-center justify-center"
      title="Add a new question to this section"
    >
      <Plus size={16} className="text-white" />
    </button>
  );
};
