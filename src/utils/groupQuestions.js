/**
 * Helper function to group questions by their optionalGroupId.
 * Questions without an optionalGroupId each become their own group.
 */
export const groupQuestions = (questions) => {
  const groups = [];
  const seen = new Set();

  questions.forEach((q) => {
    // If question has an optionalGroupId, group them
    if (q.optionalGroupId) {
      if (!seen.has(q.optionalGroupId)) {
        const grouped = questions.filter(
          (x) => x.optionalGroupId === q.optionalGroupId
        );
        groups.push({ groupId: q.optionalGroupId, questions: grouped });
        seen.add(q.optionalGroupId);
      }
    } else {
      // If no optionalGroupId, it's alone in its group
      groups.push({ groupId: null, questions: [q] });
    }
  });

  return groups;
};
