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
  const topicLines = Object.entries(topicsConfig).map(([topic, config]) => {
    return `
    Topic: ${topic}
      MCQs:
        Easy: ${config.easyMCQs}, Medium: ${config.mediumMCQs}, Hard: ${config.hardMCQs}
      Descriptive:
        Easy: ${config.descEasy}, Medium: ${config.descMedium}, Hard: ${config.descHard}`;
  });

  const topicsDetails = topicLines.length > 0 ? topicLines.join("\n") : "No specific topics configured.";

  // Construct optional descriptive questions details
  const optionalDetails = `
Optional Descriptive Questions:
  Easy (${easyDescOptionalCount} total): ${easyDescOptionalTopics.length > 0 ? easyDescOptionalTopics.join(", ") : "None selected"}
  Medium (${mediumDescOptionalCount} total): ${mediumDescOptionalTopics.length > 0 ? mediumDescOptionalTopics.join(", ") : "None selected"}
  Hard (${hardDescOptionalCount} total): ${hardDescOptionalTopics.length > 0 ? hardDescOptionalTopics.join(", ") : "None selected"}
`.trim();

  return `
You are an expert exam-setter. Create a well-structured, balanced, and challenging question paper following these exact specifications:

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

Topic-wise Configuration:
${topicsDetails}

${optionalDetails}

IMPORTANT REQUIREMENTS:
1. Exact Question Counts: You must include the exact number of MCQs and descriptive questions for each difficulty level and topic as specified. Do not omit or reduce the number of questions.
Output Format: The question paper should be returned in HTML format, utilizing appropriate HTML tags for structure and styling to ensure clarity and readability.
2. For MCQs, distribute them across the specified topics and difficulty levels, ensuring each count is met exactly.
3. For descriptive questions, also ensure the exact count is provided for each difficulty level per topic.
4. Include all optional descriptive questions as specified. The number of optional questions (easy, medium, hard) and their selected topics must match the given counts exactly.
5. The question paper should be clearly organized into sections and each question should clearly indicate its marks.
6. Ensure a logical progression and a variety of question types where possible.
7. Follow any additional instructions or formatting guidelines provided.
8. Do not include marks of the question with each question.
9. Give appropriate numbers to each question and sections.
10.The output should not contain any other thing apart from html content.
11. Include an answer sheet with the paper as well. Differentiate between the question paper and answer sheet with the html tag with the answersheet included in a seperate html content file.


Your final output should be a complete question paper meeting all these conditions, with every single required question included.
`.trim();
};
