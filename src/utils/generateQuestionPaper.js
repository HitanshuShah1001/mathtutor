import { openai } from "./InitOpenAI";
import { DEMO_CONFIG, models, USER } from "../constants/constants";
import {
  GENERATE_USER_PROMPT,
  GENERATE_USER_PROMPT_HTML,
} from "./Questionpaperutils";
import { generateQuestionsArray } from "./generateJsonToPassToReceiveJson";

export const generateQuestionPaper = async ({
  setIsLoading,
  setResponseText,
  topicsConfig,
}) => {
  try {
    setResponseText("");
    setIsLoading(true);
    const blueprint = generateQuestionsArray(topicsConfig);
    console.log(blueprint,"BLUEPRINT")
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
    return;
    const responseToHtml = await openai.chat.completions.create({
      model: models.O1_MINI,
      messages: [
        {
          role: USER,
          content: GENERATE_USER_PROMPT_HTML(JSON.stringify(content)),
        },
      ],
    });
    const contentHTML = responseToHtml.choices?.[0]?.message?.content || "";
    console.log(contentHTML, "cotnent after");
  } catch (e) {
    console.log("error occurred", e);
  } finally {
    setIsLoading(false);
  }
};
