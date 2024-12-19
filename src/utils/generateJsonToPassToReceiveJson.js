export function generateQuestionsArray(inputData) {
  let outputArray = [];

  for (const topic in inputData) {
    const config = inputData[topic];
    for (let [key, value] of Object.entries(config)) {
      for (let val in value) {
        if (val.includes("MCQ")) {
          for (let i = 0; i < value[val]; i++) {
            outputArray.push({
              topic: key,
              difficulty: val.includes("easy")
                ? "EASY"
                : val.includes("medium")
                ? "MEDIUM"
                : "HARD",
              marks: config.mcqMarks || 1,
              type: "MCQ",
            });
          }
        }
      }
    }
    console.log(config, "config");
    for (let [key, value] of Object.entries(config)) {
      const descriptiveConfig = value?.descriptiveQuestionConfig;
      for (let val of descriptiveConfig) {
        for (let i = 0; i < parseInt(val?.noOfQuestions); i++) {
          outputArray.push({
            topic: key,
            difficulty: val.difficulty,
            marks: val.marks,
            type: "DESCRIPTIVE",
          });
        }
      }
    }
  }
  console.log(outputArray)
  return outputArray;
}

