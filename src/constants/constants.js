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

export const SYSTEM_PROMPT = `Given an input blueprint for creating a question paper along with a grade for which the question paper has to be set, output a  json for generating a math question paper along with its solutions as expected in the output response format.

Important Instructions.
1. Marks for a question indicate the complexity of the question. A question with higher marks should take more steps/time/complexity to solve.
2. The solution for each question should follow a chain of thought with multiple steps. Do not skip any steps. Follow the NCERT Maths book for reference on how to to provide chain of thought reasoning and granularity for steps. If confused, err on the side of providing one more step rather than 1 less step in the solution.
3. Make sure that questions for the same topics do not all appear in sequence. The order of questions should be jumbled both in terms of topics and in terms of difficulty. Provide all MCQs first and then the descriptive questions.

Given below is the sample input schema for the question paper"

{
    "blueprint": [
        {
            "type": "MCQ",
            "breakdown": [
                {
                    "topic": "Linear Equations",
                    "questions": [
                        {
                            "difficulty": "EASY",
                            "Number": 2
                        },
                        {
                            "difficulty": "MEDIUM",
                            "Number": 2
                        },
                        {
                            "difficulty": "HARD",
                            "Number": 1
                        }
                    ]
                },
                {
                    "topic": "Rational Numbers",
                    "questions": [
                        {
                            "difficulty": "EASY",
                            "Number": 2
                        },
                        {
                            "difficulty": "MEDIUM",
                            "Number": 1
                        },
                        {
                            "difficulty": "HARD",
                            "Number": 2
                        }
                    ]
                },
                {
                    "topic": "Exponents and Power",
                    "questions": [
                        {
                            "difficulty": "EASY",
                            "Number": 4
                        },
                        {
                            "difficulty": "HARD",
                            "Number": 1
                        }
                    ]
                }
            ]
        },
        {
            "type": "Descriptive",
            "breakdown": [
                {
                    "topic": "Linear Equations",
                    "breakdown": [
                        {
                            "marks": 2,
                            "breakdown": [
                                {
                                    "difficulty": "EASY",
                                    "number": 1
                                },
                                {
                                    "difficulty": "MEDIUM",
                                    "number": 1
                                }
                            ]
                        },
                        {
                            "marks": 3,
                            "breakdown": [
                                {
                                    "difficulty": "EASY",
                                    "number": 1
                                },
                                {
                                    "difficulty": "MEDIUM",
                                    "number": 1
                                }
                            ]
                        },
                        {
                            "marks": 5,
                            "breakdown": [
                                {
                                    "difficulty": "HARD",
                                    "number": 1
                                }
                            ]
                        }
                    ]
                },
                {
                    "topic": "Rational Numbers",
                    "breakdown": [
                        {
                            "marks": 2,
                            "breakdown": [
                                {
                                    "difficulty": "EASY",
                                    "number": 1
                                },
                                {
                                    "difficulty": "MEDIUM",
                                    "number": 1
                                }
                            ]
                        },
                        {
                            "marks": 3,
                            "breakdown": [
                                {
                                    "difficulty": "EASY",
                                    "number": 1
                                },
                                {
                                    "difficulty": "MEDIUM",
                                    "number": 1
                                }
                            ]
                        },
                        {
                            "marks": 5,
                            "breakdown": [
                                {
                                    "difficulty": "EASY",
                                    "number": 1
                                }
                            ]
                        }
                    ]
                },
                {
                    "topic": "Exponents and Power",
                    "breakdown": [
                        {
                            "marks": 2,
                            "breakdown": [
                                {
                                    "difficulty": "MEDIUM",
                                    "number": 1
                                }
                            ]
                        },
                        {
                            "marks": 3,
                            "breakdown": [
                                {
                                    "difficulty": "EASY",
                                    "number": 1
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
}

`;
