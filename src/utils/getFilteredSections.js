/**
   * Filters the sections by the search term so that only matching questions appear.
   */
export const getFilteredSections = ({searchTerm,sections}) => {
    const lowerSearch = searchTerm?.toLowerCase();
    const filtered = sections.map((section) => {
      const filteredQuestions = section.questions.filter((q) =>
        q.questionText?.toLowerCase().includes(lowerSearch)
      );
      return { ...section, questions: filteredQuestions };
    });
    return filtered;
  };