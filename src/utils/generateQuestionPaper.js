import { openai } from "./InitOpenAI";
import { models, USER } from "../constants/constants";
import {
  GENERATE_USER_PROMPT,
  QUESTION_PAPER_AND_ANSWER_SHEET_SCHEMA,
  QUESTION_PAPER_SCHEMA,
  Schema,
  USER_PROMPT_GENERATE_QUESTION_PAPER,
} from "./Questionpaperutils";
import {
  generateQuestionsArray,
  reorderQuestionsByType,
} from "./generateJsonToPassToReceiveJson";
import { handleGeneratePDFs } from "./generatePdf";

export const generateQuestionPaper = async ({ setIsLoading, topicsConfig }) => {
  try {
    setIsLoading(true);
    const blueprint = reorderQuestionsByType(
      generateQuestionsArray(topicsConfig)
    );

    const response = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: USER,
          content: GENERATE_USER_PROMPT(JSON.stringify(blueprint)),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: QUESTION_PAPER_SCHEMA,
      },
    });

    const content = response.choices?.[0]?.message?.content || "";
    console.log(content,"content received");
    const responseToHtml = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: USER,
          content: USER_PROMPT_GENERATE_QUESTION_PAPER(content),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: QUESTION_PAPER_AND_ANSWER_SHEET_SCHEMA,
      },
    });

    const contentHTML = responseToHtml.choices?.[0]?.message?.content || "";
    console.log(contentHTML,"contentHTML received");
    handleGeneratePDFs(contentHTML);
  } catch (e) {
    console.log("error occurred", e);
  } finally {
    setIsLoading(false);
  }
};
