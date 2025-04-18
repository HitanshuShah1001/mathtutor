import React, { useState } from "react";

const modalContainerClass =
  "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4";
const modalContentClass =
  "bg-white border border-gray-300 shadow-lg rounded-lg overflow-auto p-6 relative";

const ChaptersModal = ({
  showChaptersModal,
  setShowChaptersModal,
  chapters = [],
  chapterstoomit = [],
  filters = { chapters: [] },
  toggleFilterValue,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter out omitted chapters and apply search term
  const searchableChapters = chapters.filter(
    (ch) => !chapterstoomit.includes(ch)
  );
  const displayedChapters = searchableChapters.filter((ch) =>
    ch.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!showChaptersModal) return null;

  return (
    <div className={modalContainerClass}>
      <div className={`${modalContentClass} w-[900px] max-h-[70vh] h-auto`}>
        <h2 className="text-xl font-semibold mb-4">Select Chapters</h2>

        {/* Search bar */}
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search chapters..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {/* Chapter chips */}
        <div className="flex flex-wrap gap-2">
          {displayedChapters.length > 0 ? (
            displayedChapters.map((ch) => {
              const isSelected = filters.chapters.includes(ch);
              return (
                <span
                  key={ch}
                  onClick={() => toggleFilterValue("chapters", ch)}
                  className={`px-3 py-1 rounded-full cursor-pointer transition-colors text-sm ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                >
                  {ch}
                </span>
              );
            })
          ) : (
            <p className="text-gray-500">No chapters found</p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setShowChaptersModal(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChaptersModal;
