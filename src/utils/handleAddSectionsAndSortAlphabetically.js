/**
 * Handles creating and adding a new section to the local state.
 * This doesn't persist to the server directly in this function.
 */

export const handleAddSection = ({
  newSectionName,
  sections,
  setSections,
  setShowAddSectionModal,
  setNewSectionName,
}) => {
  if (!newSectionName.trim()) {
    alert("Please enter a valid section name.");
    return;
  }
  const newSec = { name: newSectionName.trim(), questions: [] };
  const updated = [...sections, newSec];
  const sorted = sortSectionsAlphabetically(updated);
  setSections(sorted);
  setShowAddSectionModal(false);
  setNewSectionName("");
};

export const sortSectionsAlphabetically = (sections) => {
  return [...sections].sort((a, b) => a.name.localeCompare(b.name));
};
