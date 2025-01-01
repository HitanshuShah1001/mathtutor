import { openai } from "./InitOpenAI";
import { JSON_SCHEMA, models, USER } from "../constants/constants";
import {
  GENERATE_USER_PROMPT,
  generateContent,
  QUESTION_PAPER_AND_ANSWER_SHEET_SCHEMA,
  QUESTION_PAPER_SCHEMA,
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
  setResponseText,
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
      // response_format: {
      //   type: JSON_SCHEMA,
      //   json_schema: QUESTION_PAPER_SCHEMA,
      // },
    });

    const content = generateContent(response);
    const responseToHtml = await openai.chat.completions.create({
      model: models.O1_MINI,
      messages: [
        {
          role: USER,
          content: USER_PROMPT_GENERATE_QUESTION_PAPER(content),
        },
      ],
      // response_format: {
      //   type: JSON_SCHEMA,
      //   json_schema: QUESTION_PAPER_AND_ANSWER_SHEET_SCHEMA,
      // },
    });

    const contentHTML = generateContent(responseToHtml);
    const contentHTMLINTOJSON = JSON.parse(contentHTML);
    setResponseText(contentHTMLINTOJSON);
    handleGeneratePDFs(contentHTMLINTOJSON);
  } catch (e) {
    console.log("error occurred", e);
  } finally {
    setIsLoading(false);
  }
};
