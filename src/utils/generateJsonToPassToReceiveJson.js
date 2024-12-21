import { difficulty } from "../constants/constants";

export function generateQuestionsArray(inputData) {
  let outputArray = [];
  for (const topic in inputData) {
    const config = inputData[topic];
    for (let [key, value] of Object.entries(config)) {
      if (key.includes("MCQ")) {
        for (let i = 0; i < value; i++) {
          outputArray.push({
            topic,
            difficulty: key.includes("easy")
              ? difficulty.EASY
              : key.includes("medium")
              ? difficulty.MEDIUM
              : difficulty.HARD,
            marks: config.mcqMarks || 1,
            type: "Multiple Choice Question",
          });
        }
      }
    }
    for (let [key, value] of Object.entries(config)) {
      if (value?.length > 0) {
        for (let val of value) {
          for (let i = 0; i < parseInt(val?.noOfQuestions); i++) {
            outputArray.push({
              topic,
              difficulty: val.difficulty.toUpperCase(),
              marks: val.marks,
              type: "Descriptive Question",
            });
          }
        }
      }
    }
  }
  return outputArray;
}
