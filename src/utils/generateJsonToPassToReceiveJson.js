export const generateJsonToPassToReceiveJson = ({
  topicsConfig,
  standard,
  subject,
  marks,
  anyotherQuery,
  easyDescOptionalCount,
  mediumDescOptionalCount,
  hardDescOptionalCount,
  easyDescOptionalTopics,
  mediumDescOptionalTopics,
  hardDescOptionalTopics,
}) => {
  const blueprint = [
    {
      type: "MCQ",
      breakdown: [],
    },
    {
      type: "Descriptive",
      breakdown: [],
    },
  ];

  // Helper to capitalize difficulty
  function toDifficultyLevel(diff) {
    return diff.toUpperCase();
  }

  // Build MCQ breakdown
  for (const topic in topicsConfig) {
    const { easyMCQs, mediumMCQs, hardMCQs } = topicsConfig[topic];
    // If MCQs are defined
    if (
      typeof easyMCQs === "number" &&
      typeof mediumMCQs === "number" &&
      typeof hardMCQs === "number"
    ) {
      blueprint[0].breakdown.push({
        topic: topic,
        questions: [
          {
            difficulty: "EASY",
            Number: easyMCQs,
          },
          {
            difficulty: "MEDIUM",
            Number: mediumMCQs,
          },
          {
            difficulty: "HARD",
            Number: hardMCQs,
          },
        ],
      });
    }
  }

  // Build Descriptive breakdown
  for (const topic in topicsConfig) {
    const { descriptiveQuestionConfig } = topicsConfig[topic];
    if (Array.isArray(descriptiveQuestionConfig)) {
      // Group by marks
      const marksGroup = {};

      descriptiveQuestionConfig.forEach((cfg) => {
        const marks = parseInt(cfg.marks, 10);
        const difficulty = toDifficultyLevel(cfg.difficulty);
        const noOfQuestions = parseInt(cfg.noOfQuestions, 10);

        if (!marksGroup[marks]) {
          marksGroup[marks] = [];
        }

        marksGroup[marks].push({
          difficulty: difficulty,
          number: noOfQuestions,
        });
      });

      // Convert marksGroup into an array
      const descriptiveBreakdown = Object.keys(marksGroup).map((m) => {
        return {
          marks: parseInt(m, 10),
          breakdown: marksGroup[m],
        };
      });
      if (descriptiveBreakdown.length > 0) {
        blueprint[1].breakdown.push({
          topic: topic,
          breakdown: descriptiveBreakdown,
        });
      }
    }
  }
  if (marks) {
    blueprint.push({ marks });
  }
  if(blueprint[1].breakdown.length == 0){
    blueprint.splice(1,1);
  }
  
  blueprint.push({ standard });
  blueprint.push({ subject });

  return { blueprint };
};
