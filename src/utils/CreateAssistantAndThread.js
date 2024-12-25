import {
  ASSISTANT_INSTRUCTIONS,
  MESSAGE_STATUS,
  models,
} from "../constants/constants.js";
import { openai } from "../utils/InitOpenAI.js";

export async function createFile({ file, standard }) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("purpose", "assistants"); // Adjust purpose as needed
  try {
    const response = await fetch("https://api.openai.com/v1/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
      },
      body: formData,
    });
    const result = await response.json();
    if (result?.error) {
      alert(result?.error?.message);
    } else {
      alert("File uploaded successfully!");
      console.log(result, "result");
      return result;
    }
  } catch (error) {
    console.error("Error uploading file to OpenAI:", error);
  }
}

export async function createAssistant({ file_id, standard }) {
  try {
    const myAssistant = await openai.beta.assistants.create({
      instructions: ASSISTANT_INSTRUCTIONS,
      name: `Assistant for Standard ${standard}`,
      description: `A personal tutor that can analyse data of Standard ${standard} and provide insights for each student.`,
      tools: [{ type: "code_interpreter" }],
      tool_resources: {
        code_interpreter: {
          file_ids: [file_id],
        },
      },
      model: models.GPT_4O,
    });
    return myAssistant;
  } catch (error) {
    console.error(MESSAGE_STATUS.ERROR_CREATE_ASSISTANT, error);
  }
}

export async function createThread() {
  try {
    const thread = await openai.beta.threads.create();
    return thread.id;
  } catch (error) {
    console.error(MESSAGE_STATUS.ERROR_CREATE_THREAD, error);
    return null;
  }
}
