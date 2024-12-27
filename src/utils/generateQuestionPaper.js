import { openai } from "./InitOpenAI";
import { models, USER } from "../constants/constants";
import {
  GENERATE_USER_PROMPT,
  USER_PROMPT_GENERATE_QUESTION_PAPER,
} from "./Questionpaperutils";
import {
  generateQuestionsArray,
  reorderQuestionsByType,
} from "./generateJsonToPassToReceiveJson";
import { handleGeneratePDFs } from "./generatePdf";

export const generateQuestionPaper = async ({
  setIsLoading,
  topicsConfig,
}) => {
  try {
    setIsLoading(true);
    const blueprint = reorderQuestionsByType(
      generateQuestionsArray(topicsConfig)
    );

    const response = await openai.chat.completions.create({
      model: models.O1_MINI,
      messages: [
        {
          role: USER,
          content: GENERATE_USER_PROMPT(JSON.stringify(blueprint)),
        },
      ],
    });
    const content = response.choices?.[0]?.message?.content || "";
    console.log(content, "content");
    const responseToHtml = await openai.chat.completions.create({
      model: models.O1_MINI,
      messages: [
        {
          role: USER,
          content: USER_PROMPT_GENERATE_QUESTION_PAPER(content),
        },
      ],
    });
    const contentHTML = responseToHtml.choices?.[0]?.message?.content || "";
    handleGeneratePDFs(contentHTML)
  } catch (e) {
    console.log("error occurred", e);
  } finally {
    setIsLoading(false);
  }
};
