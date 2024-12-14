export const generatePrompt = ({
  topicsConfig,
  standard,
  subject,
  marks,
  mcqs,
  anyotherQuery,
}) => {
  // Construct a detailed prompt with the topicsConfig
  const topicsDetails = Object.entries(topicsConfig)
    .map(([topic, config]) => {
      // Construct a string for descriptive questions
      const descDetails = config.descDifficulties
        .map((diff, i) => {
          return `    Q${i + 1}: Difficulty - ${diff}, Marks: ${
            config.descMarksPerQuestion[i]
          }`;
        })
        .join("\n");

      return `Topic: ${topic}
  MCQs -> Easy: ${config.easyMCQs}, Medium: ${config.mediumMCQs}, Hard: ${config.hardMCQs}, MCQ Marks Each: ${config.mcqMarks}
${descDetails}`;
    })
    .join("\n\n");

  return `Generate a question paper for:
Standard: ${standard}
Subject: ${subject.charAt(0).toUpperCase() + subject.slice(1)}
Total Marks: ${marks}
Number of MCQs: ${mcqs}
Additional input: ${anyotherQuery}

Topic Details:
${topicsDetails}

Instructions: Create a well-structured and balanced question paper, ensuring topics are proportionally represented. Consider the specified MCQ difficulties and descriptive question difficulties for each topic, and use the given marks per question.`;
};
