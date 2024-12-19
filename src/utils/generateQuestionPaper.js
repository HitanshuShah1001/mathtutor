import { openai } from "./InitOpenAI";
import { DEMO_CONFIG } from "../constants/constants";
import { GENERATE_USER_PROMPT, GENERATE_USER_PROMPT_HTML } from "./Questionpaperutils";

export const generateQuestionPaper = async ({
  setIsLoading,
  setResponseText,
}) => {
  try {
    setResponseText("");
    setIsLoading(true);
    const blueprint = DEMO_CONFIG;
    const response = await openai.chat.completions.create({
      model: "o1-mini",
      messages: [
        {
          role: "user",
          content: GENERATE_USER_PROMPT(JSON.stringify(blueprint)),
        },
      ],
    });
    const content = response.choices?.[0]?.message?.content || "";
    console.log(content,"cotnent")
    const responseToHtml = await openai.chat.completions.create({
      model: "o1-mini",
      messages: [
        {
          role: "user",
          content: GENERATE_USER_PROMPT_HTML(JSON.stringify(content)),
        },
      ],
    });
    const contentHTML = responseToHtml.choices?.[0]?.message?.content || "";
    console.log(contentHTML,"cotnent after")
  } catch (e) {
    console.log("error occurred", e);
  } finally {
    setIsLoading(false);
  }
};
