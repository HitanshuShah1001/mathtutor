import { RESPONSE_FORMAT, SYSTEM_PROMPT } from "../constants/constants";
import { openai } from "./InitOpenAI";

export const generateJson = async () => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: "demo" },
      ],
      response_format: RESPONSE_FORMAT,
    });
    console.log(response,"response that received");
    return response;
  } catch (e) {
    console.log(e, "an error occured");
  }
};
