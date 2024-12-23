export const USER = "user";
export const ASSISTANT = "assistant";
export const BASE_URL_API = "http://tutor.ap-south-1.elasticbeanstalk.com";
export const API_SEND_OTP = "auth/send-otp";
export const OTP_VERIFY = "auth/verify-otp";
export const ACCESS_KEY = "accessKey";
export const SYSTEM = "system";
export const difficulty = {
  EASY: "EASY",
  MEDIUM: "MEDIUM",
  HARD: "HARD",
};
export const models = {
  O1_PREVIEW: "o1-preview",
  O1_PREVIEW_2024_09_12: "o1-preview-2024-09-12",
  O1_MINI: "o1-mini",
  O1_MINI_2024_09_12: "o1-mini-2024-09-12",
  GPT_4O: "gpt-4o",
  GPT_4O_2024_11_20: "gpt-4o-2024-11-20",
  GPT_4O_2024_08_06: "gpt-4o-2024-08-06",
  GPT_4O_2024_05_13: "gpt-4o-2024-05-13",
  GPT_4O_REALTIME_PREVIEW: "gpt-4o-realtime-preview",
  GPT_4O_REALTIME_PREVIEW_2024_10_01: "gpt-4o-realtime-preview-2024-10-01",
  GPT_4O_AUDIO_PREVIEW: "gpt-4o-audio-preview",
  GPT_4O_AUDIO_PREVIEW_2024_10_01: "gpt-4o-audio-preview-2024-10-01",
  CHATGPT_4O_LATEST: "chatgpt-4o-latest",
  GPT_4O_MINI: "gpt-4o-mini",
  GPT_4O_MINI_2024_07_18: "gpt-4o-mini-2024-07-18",
  GPT_4_TURBO: "gpt-4-turbo",
  GPT_4_TURBO_2024_04_09: "gpt-4-turbo-2024-04-09",
  GPT_4_0125_PREVIEW: "gpt-4-0125-preview",
  GPT_4_TURBO_PREVIEW: "gpt-4-turbo-preview",
  GPT_4_1106_PREVIEW: "gpt-4-1106-preview",
  GPT_4_VISION_PREVIEW: "gpt-4-vision-preview",
  GPT_4: "gpt-4",
  GPT_4_0314: "gpt-4-0314",
  GPT_4_0613: "gpt-4-0613",
  GPT_4_32K: "gpt-4-32k",
  GPT_4_32K_0314: "gpt-4-32k-0314",
  GPT_4_32K_0613: "gpt-4-32k-0613",
  GPT_3_5_TURBO: "gpt-3.5-turbo",
  GPT_3_5_TURBO_16K: "gpt-3.5-turbo-16k",
  GPT_3_5_TURBO_0301: "gpt-3.5-turbo-0301",
  GPT_3_5_TURBO_0613: "gpt-3.5-turbo-0613",
  GPT_3_5_TURBO_1106: "gpt-3.5-turbo-1106",
  GPT_3_5_TURBO_0125: "gpt-3.5-turbo-0125",
  GPT_3_5_TURBO_16K_0613: "gpt-3.5-turbo-16k-0613",
};

export const RESPONSE_FORMAT = {
  name: "quiz_schema",
  strict: true,
  schema: {
    type: "object",
    properties: {
      answer: {
        type: "array",
        description:
          "A collection of answers, each answer can be a multiple choice question or descriptive question.",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["MCQ", "Descriptive"],
              description: "The type of the question.",
            },
            question: {
              type: "string",
              description: "The question being asked.",
            },
            marks: {
              type: "number",
              description: "The marks assigned for the question.",
            },
            options: {
              anyOf: [
                {
                  type: "array",
                  description: "Options for multiple choice questions.",
                  items: {
                    type: "object",
                    properties: {
                      key: {
                        type: "string",
                        description:
                          "The key for the option, e.g., A, B, C, D.",
                      },
                      option: {
                        type: "string",
                        description: "The text of the option.",
                      },
                    },
                    required: ["key", "option"],
                    additionalProperties: false,
                  },
                },
                {
                  type: "null",
                  description:
                    "Indicates 'null' for descriptive questions which do not have options.",
                },
              ],
            },
            difficulty: {
              type: "string",
              enum: ["EASY", "MEDIUM", "HARD"],
              description: "The difficulty level of the question.",
            },
            topic: {
              type: "string",
              description: "The topic related to the question.",
            },
            correctAnswer: {
              type: "string",
              description: "The correct answer for the question.",
            },
            calculationSteps: {
              type: "array",
              description: "Steps to arrive at the solution of the question.",
              items: {
                type: "object",
                properties: {
                  chainOfThoughtExplanation: {
                    type: "string",
                    description:
                      "Explanation of the thought process behind a calculation step.",
                  },
                  equation: {
                    type: "string",
                    description:
                      "The equation or result at this step of the calculation.",
                  },
                },
                required: ["chainOfThoughtExplanation", "equation"],
                additionalProperties: false,
              },
            },
          },
          required: [
            "type",
            "question",
            "marks",
            "options",
            "difficulty",
            "topic",
            "correctAnswer",
            "calculationSteps",
          ],
          additionalProperties: false,
        },
      },
    },
    required: ["answer"],
    additionalProperties: false,
  },
};

// constants.js
export const MESSAGE_STATUS = {
  WARN_RUN_STATUS: "[getResults] Run status is not completed:",
  ERROR_GET_RESULTS: "Error in getResults:",
  ERROR_CREATE_THREAD: "Error creating thread:",
  ERROR_CREATE_MESSAGE: "Error creating message:",
  ERROR_CREATE_RUN: "Error creating run:",
  ERROR_GET_RUN: "Error getting run status:",
};

export const API_ENDPOINTS = {
  THREADS: "/api/threads",
  MESSAGES: "/api/messages",
  RUNS: "/api/runs",
};

export const RUN_STATUS = {
  COMPLETED: "completed",
  FAILED: "failed",
};

export const UI_MESSAGES = {
  SYSTEM_MESSAGE: "I am Claude, an AI assistant. How can I help you today?",
  ASSISTANT_NAME: "Assistant",
  USER_NAME: "You",
};

export const THREAD_ID = "thread_id";


export const ASSISTANT_ID = "asst_2bwaorGljw9JSlanqjfI1ylN";