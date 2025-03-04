import { DESCRIPTIVE, difficulty, MCQ } from "../constants/constants";

function generateUniqueUUIDArray(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const uniqueUUIDs = new Set();

  function generateUUID() {
    let uuid = "";
    for (let i = 0; i < 8; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      uuid += characters[randomIndex];
    }
    return uuid;
  }

  while (uniqueUUIDs.size < length) {
    uniqueUUIDs.add(generateUUID());
  }

  return Array.from(uniqueUUIDs);
}

function addUUIDToBluePrintObjects(blueprint) {
  const LENGTH_OF_BLUEPRINT = blueprint.length;
  const uuidArray = generateUniqueUUIDArray(LENGTH_OF_BLUEPRINT);
  for (let i = 0; i < LENGTH_OF_BLUEPRINT; i++) {
    blueprint[i].questionId = uuidArray[i];
  }
  return blueprint;
}

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
            type: MCQ,
          });
        }
      }
    }
    for (let [, value] of Object.entries(config)) {
      if (value?.length > 0) {
        for (let val of value) {
          for (let i = 0; i < parseInt(val?.noOfQuestions); i++) {
            outputArray.push({
              topic,
              difficulty: val.difficulty.toUpperCase(),
              marks: val.marks,
              type: DESCRIPTIVE,
            });
          }
        }
      }
    }
  }
  return addUUIDToBluePrintObjects(outputArray);
}

/**
 * Reorders questions by type, placing Multiple Choice Questions (MCQs) first.
 * @param {Array} questions - Array of question objects.
 * @returns {Array} - Reordered array with MCQs first followed by Descriptive Questions.
 * @throws {Error} - If the input is not an array.
 */
export function reorderQuestionsByType(questions) {
  if (!Array.isArray(questions)) {
    throw new Error("Input must be an array of objects.");
  }

  const mcqs = [];
  const descriptive = [];

  questions.forEach((question) => {
    if (question.type === MCQ) {
      mcqs.push(question);
    } else if (question.type === DESCRIPTIVE) {
      descriptive.push(question);
    }
  });

  return [...mcqs, ...descriptive];
}



// Example usage:
// const inputData = [
//   { name: 'Alice', topics: ['Algebra', 'Geometry'] },
//   { name: 'Bob', topics: ['Chemistry', 'Physics'] }
// ];
