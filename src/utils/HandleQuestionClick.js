export const handleQuestionClick = ({
  question,
  setOriginalQuestion,
  setEditedQuestion,
  setQuestionImageUrls,
}) => {
  setOriginalQuestion(question);
  setEditedQuestion(JSON.parse(JSON.stringify(question)));
  setQuestionImageUrls([]);
};
