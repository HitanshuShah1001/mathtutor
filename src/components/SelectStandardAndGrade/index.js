import React, { useState } from "react";
import { STORAGE_MESSAGES } from "../../constants/constants";
import {
  createAssistant,
  createFile,
  createThread,
} from "../../utils/CreateAssistantAndThread";
import { useNavigate } from "react-router-dom";

export const SelectStandard = ({ onNext }) => {
  const navigate = useNavigate();
  const [selectedStandard, setSelectedStandard] = useState("");
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleNext = async () => {
    if (!selectedStandard) {
      alert(STORAGE_MESSAGES.SELECT_STANDARD);
      return;
    }

    const existingData = localStorage.getItem(selectedStandard);

    const saveData = async (override = false) => {
      if (!existingData || override) {
        const fileData = await createFile({ file, standard: selectedStandard });
        const assistant = await createAssistant({
          file_id: fileData.id,
          standard: selectedStandard,
        });
        const newThread = await createThread();
        console.log(fileData, assistant, newThread);
        localStorage.setItem(
          selectedStandard,
          JSON.stringify({
            assistant: assistant.id,
            thread: newThread.id,
            file: fileData.id,
          })
        );
        navigate("/report-analyser");
      }
    };

    if (existingData) {
      const override = window.confirm(STORAGE_MESSAGES.OVERRIDE_CONFIRM);
      if (!override) {
        alert(STORAGE_MESSAGES.CONTINUE_EXISTING);
        navigate("/report-analyser");
      } else {
        await saveData(true);
      }
    } else {
      await saveData();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 font-['Inter', sans-serif] p-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-2xl rounded-2xl p-8 space-y-6 transition-all duration-300 transform hover:scale-105">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Select Standard
            </h2>
          </div>

          <div className="space-y-4">
            <select
              value={selectedStandard}
              onChange={(e) => setSelectedStandard(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
            >
              <option value="" disabled>
                Select a standard
              </option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((standard) => (
                <option key={standard} value={standard}>
                  Standard {standard}
                </option>
              ))}
            </select>

            <div className="w-full">
              <label className="block text-gray-600 font-semibold mb-2">
                Upload File (Optional):
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
              />
            </div>
          </div>

          <button
            onClick={handleNext}
            className={`w-full py-3 rounded-lg text-white font-semibold transition-all duration-300 bg-blue-500 hover:bg-blue-600`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
