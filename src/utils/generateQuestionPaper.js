import { openai } from "../components/InitOpenAI";
import { generatePrompt } from "./GeneratePrompt";

export const generateQuestionPaper = async ({
  setIsLoading,
  setResponseText,
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
  try {
    setResponseText("");
    setIsLoading(true);
    const prompt = generatePrompt({
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
    });
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });
    const content = response.choices?.[0]?.message?.content || "";
    setResponseText(content);
  } catch (e) {
    console.log("error occurred", e);
  } finally {
    setIsLoading(false); // Hide loader after response
  }
};
