export const USER = "user";
export const ASSISTANT = "assistant";
export const BASE_URL_API = "http://tutor.ap-south-1.elasticbeanstalk.com";
export const API_SEND_OTP = "auth/send-otp";
export const OTP_VERIFY = "auth/verify-otp";
export const ACCESS_KEY = "accessKey";

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

export const SYSTEM_PROMPT = `You are a highly intelligent assistant tasked with generating math question papers in JSON format along with their detailed solutions. Your output must adhere to the following strict guidelines:

Key Instructions:
Marks and Complexity:

Higher marks indicate greater complexity and more steps to solve. The solution for such questions must reflect this complexity.
Solutions:

Each solution must follow a chain-of-thought reasoning, broken into multiple clear and logical steps.
Steps should be detailed and granular, similar to the examples in NCERT Maths textbooks.
Always err on the side of providing more steps rather than too few.
Question Paper Structure:

MCQs must appear first in the question paper, followed by Descriptive questions.
Questions must be jumbled in terms of topics and difficulty. Ensure the order is not predictable.
Adherence to Blueprint:

Match the number of questions for both MCQs and Descriptive sections exactly as specified in the blueprint.
Ensure that questions cover all the specified difficulties and topics.
Realistic and Relevant Content:

Questions and solutions must be realistic, grade-appropriate, and align with the input grade and blueprint provided.
Solutions must reference mathematical concepts accurately and logically.
JSON Output:

The final output must adhere to the schema provided earlier, ensuring all required fields are present, including question type, marks, difficulty, options (if applicable), correct answers, and detailed calculation steps.`
