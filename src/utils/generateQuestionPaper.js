import { openai } from "./InitOpenAI";
import { generateJsonToPassToReceiveJson } from "./generateJsonToPassToReceiveJson";
import { RESPONSE_FORMAT, SYSTEM_PROMPT } from "../constants/constants";

export const generateQuestionPaper = async ({
  setIsLoading,
  setResponseText,
  topicsConfig,
  standard,
  subject,
  marks,
}) => {
  try {
    setResponseText("");
    setIsLoading(true);
    const blueprint = generateJsonToPassToReceiveJson({
      topicsConfig,
      standard,
      subject,
      marks,
    });
    console.log(blueprint, "blue print ");
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Generate a JSON representation of a math question paper along with detailed solutions, based on the following blueprint: :-  ${JSON.stringify(blueprint)}`,
        },
      ],
      response_format: { type: "json_schema", json_schema: RESPONSE_FORMAT },

    });
    const content = response.choices?.[0]?.message?.content || "";
    console.log(content, "content");
    return;
    const finalResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `Generate a question paper in a html format for the given input ${content}`,
        },
      ],
    });
    console.log(finalResponse,"final response")
    // setResponseText(content);
  } catch (e) {
    console.log("error occurred", e);
  } finally {
    setIsLoading(false); // Hide loader after response
  }
};
