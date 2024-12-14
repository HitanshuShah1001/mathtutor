export const generatePrompt = ({
  title,
  topicsConfig,
  standard,
  subject,
  marks,
  mcqs,
  anyotherQuery,
  easyMCQMarks,
  mediumMCQMarks,
  hardMCQMarks,
  easyDescMarks,
  mediumDescMarks,
  hardDescMarks,
  easyDescOptionalCount,
  mediumDescOptionalCount,
  hardDescOptionalCount,
  easyDescOptionalTopics,
  mediumDescOptionalTopics,
  hardDescOptionalTopics,
}) => {
  // Construct topic details section
  const topicsDetails = Object.entries(topicsConfig)
    .map(([topic, config]) => {
      return `Topic: ${topic}
    MCQs:
      Easy: ${config.easyMCQs}, Medium: ${config.mediumMCQs}, Hard: ${config.hardMCQs}
    Descriptive:
      Easy: ${config.descEasy}, Medium: ${config.descMedium}, Hard: ${config.descHard}`;
    })
    .join("\n\n");

  // Construct optional descriptive questions details
  const optionalDetails = `
Optional Descriptive Questions:
  Easy (${easyDescOptionalCount} total): ${easyDescOptionalTopics.length > 0 ? easyDescOptionalTopics.join(", ") : "None selected"}
  Medium (${mediumDescOptionalCount} total): ${mediumDescOptionalTopics.length > 0 ? mediumDescOptionalTopics.join(", ") : "None selected"}
  Hard (${hardDescOptionalCount} total): ${hardDescOptionalTopics.length > 0 ? hardDescOptionalTopics.join(", ") : "None selected"}
`.trim();

  // Combine all instructions into a single prompt
  return `
You are an expert exam-setter. Create a well-structured, balanced, and challenging question paper following these specifications.

Title: ${title || "Question Paper"}
Standard: ${standard || "Not specified"}
Subject: ${subject ? subject.charAt(0).toUpperCase() + subject.slice(1) : "Not specified"}
Total Marks: ${marks || "Not specified"}
Number of MCQs (if applicable): ${mcqs || "Not specified"}
Additional Instructions: ${anyotherQuery || "None"}

Marking Scheme:
- MCQs per question:
  Easy: ${easyMCQMarks}, Medium: ${mediumMCQMarks}, Hard: ${hardMCQMarks}
- Descriptive per question:
  Easy: ${easyDescMarks}, Medium: ${mediumDescMarks}, Hard: ${hardDescMarks}

${topicsDetails ? `Topic-wise Configuration:\n${topicsDetails}` : "No specific topics configured."}

${optionalDetails}

Please ensure the following:
1. The question paper should be clearly divided into sections and indicate marks for each question.
2. The distribution of MCQs and descriptive questions should reflect the specified numbers and difficulty levels.
3. For MCQs, use a variety of question types (conceptual, application-based) within the given difficulties.
4. For descriptive questions, incorporate progressively challenging problems as per easy, medium, and hard categories.
5. Include optional descriptive questions as specified, ensuring that the user can choose from the provided topics. The number of optional questions for each difficulty level should match the specified count.
6. The final paper should be neatly formatted, labeled, and easy to understand for a student.
7. Take into account any additional instructions provided.

Generate the final question paper, ensuring that it is logical, fair, and consistent with all the details above.
`.trim();
};
