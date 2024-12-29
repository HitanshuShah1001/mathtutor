export const GENERATE_USER_PROMPT = (
  blueprint
) => `Generate a set of questions based on the following array of objects. Each object specifies the topic, difficulty, marks, and type of the question. Iterate through the array and create one question for each objectin the array. Adhere to the following guidelines:

Question Generation Rules:

1. **Relevance**:
   - The topic key specifies the subject area the question should cover (e.g., Algebra, Relations and Functions). Ensure the question is directly aligned with the specified topic.

2. **Marks Weightage**:
   - The marks key specifies the weightage of the question. Develop questions that reflect the complexity and detail suitable for the specified marks (e.g., 1 mark for straightforward MCQs, higher marks for detailed descriptive questions).

3. **Question Format**:
   - The type key specifies the question format:
     - For "MCQ":
       - Create a question related to the topic.
       - Provide four options (labeled A, B, C, D).
       - Clearly specify the correct answer (e.g., Correct Answer: A).
     - For "DESCRIPTIVE":
       - Create a detailed question that necessitates written explanation or computation.
       - Match the depth and complexity to the marks and difficulty level.
       - Include a detailed solution or explanation for the question.
       

4. **Difficulty Level**:
   - Use the difficulty key to adjust complexity:
     - "EASY": Basic conceptual questions.
     - "MEDIUM": Questions requiring application or multi-step reasoning.
     - "HARD": Challenging questions demanding in-depth understanding.

5. **One-to-One Mapping**:
   - Generate exactly one question for each object in the array. Do not exceed or reduce the total number of questions.

Output Format:

1. Clearly number each question sequentially.
2. Group questions by type:
   - List all "MCQ" questions first.
   - Then list all "DESCRIPTIVE" questions.
3. Use appropriate headings for "MCQ" and "DESCRIPTIVE" sections.
4. Output the questions in JSON format, including the answer and an explanation (chain of thought) for each question in the same JSON object.

Input Array: Use the following input array to generate the questions without skipping any elements:
${blueprint}`;

export const GENERATE_USER_PROMPT_HTML = (content) => `User Prompt:

"Generate two HTML documents based on the given input JSON. Each document must be formatted neatly and structured as follows:

Input JSON:
The input JSON contains two sections: "MCQ" and "DESCRIPTIVE". Each section includes questions along with relevant details such as options, correct answers, explanations, and question numbers.

Output Specifications:

Document 1: Question Paper

Create an HTML document that contains all the questions from both "MCQ" and "DESCRIPTIVE" sections.
Format the document with clear headings: "Section A: Multiple Choice Questions (MCQ)" and "Section B: Descriptive Questions".
For MCQs:
Display the question text and options (A, B, C, D) in a clean layout.
Do not include the correct answer or explanation in this document.
For Descriptive questions:
Display only the question text.
Do not include the answer or explanation.
Include appropriate styling for readability (e.g., headings, spacing, and numbered questions).
Document 2: Answer Sheet

Create an HTML document that contains the answers for all questions from both sections.
Format the document with clear headings: "Section A: Multiple Choice Questions (MCQ)" and "Section B: Descriptive Questions".
For MCQs:
Display the question number and the correct answer (e.g., "1. B").
Include the explanation for each correct answer.
For Descriptive questions:
Display the question number, the full answer, and the explanation.
Use styling for clarity (e.g., bold question numbers, indent explanations).
This is the json attached ${content}`;

export const SYSTEM_PROMPT = `You are a highly intelligent assistant tasked with generating question papers in JSON format along with their detailed solutions. Your output must adhere to the following strict guidelines:

Key Instructions:
Marks and Complexity: Higher marks indicate greater complexity and more steps to solve. The solution for such questions must reflect this complexity.

Solutions:
- Each solution must follow a chain-of-thought reasoning, broken into multiple clear and logical steps.
- Steps should be detailed and granular, similar to the examples in NCERT Maths textbooks.
- Always err on the side of providing more steps rather than too few.
- Do not summarize or say that only a subset is provided. Instead, return what the exact number of questions that were asked for
- The input will be an array of objects, each defining the topic, difficulty, marks, and type of question to be generated.
- Every single object in the input array must be processed to generate a corresponding question.
- The total number of questions generated must match the length of the input array. No objects should be skipped or omitted.

Question Paper Structure:
- MCQs must appear first in the question paper, followed by Descriptive questions.
- Questions must be jumbled in terms of topics and difficulty. Ensure the order is not predictable.
- Each MCQ should be of 1 Mark.
- The correct answer should not always be only the same option for each question.

Adherence to Blueprint:
- Match the number of questions for both MCQs and Descriptive sections exactly as specified.
- Ensure that questions cover all the specified difficulties and topics.

Realistic and Relevant Content:
- Questions and solutions must be realistic, grade-appropriate, and align with the given blueprint.
- Solutions must reference mathematical concepts accurately and logically.

JSON Output:
- The final output must adhere to the schema provided earlier, ensuring all required fields are present, including question type, marks, difficulty, options (if applicable), correct answers, and detailed calculation steps.
`;

export const DEMO_CONFIG = [
  {
    topic: "Algebra",
    difficulty: "EASY",
    marks: 1,
    type: "MCQ",
  },
  {
    topic: "Algebra",
    difficulty: "MEDIUM",
    marks: 1,
    type: "MCQ",
  },
  {
    topic: "Algebra",
    difficulty: "HARD",
    marks: 1,
    type: "MCQ",
  },
  {
    topic: "Relations and Functions",
    difficulty: "EASY",
    marks: 1,
    type: "MCQ",
  },
  {
    topic: "Relations and Functions",
    difficulty: "EASY",
    marks: 1,
    type: "MCQ",
  },
  {
    topic: "Relations and Functions",
    difficulty: "EASY",
    marks: 1,
    type: "MCQ",
  },
  {
    topic: "Relations and Functions",
    difficulty: "EASY",
    marks: 1,
    type: "MCQ",
  },
  {
    topic: "Relations and Functions",
    difficulty: "EASY",
    marks: 1,
    type: "MCQ",
  },
  {
    topic: "Relations and Functions",
    difficulty: "EASY",
    marks: 1,
    type: "MCQ",
  },
  {
    topic: "Relations and Functions",
    difficulty: "EASY",
    marks: 1,
    type: "MCQ",
  },
  {
    topic: "Relations and Functions",
    difficulty: "EASY",
    marks: 1,
    type: "MCQ",
  },
  {
    topic: "Relations and Functions",
    difficulty: "EASY",
    marks: 1,
    type: "MCQ",
  },
  {
    topic: "Relations and Functions",
    difficulty: "EASY",
    marks: 1,
    type: "MCQ",
  },
  {
    topic: " Calculus",
    difficulty: "easy",
    marks: "2",
    type: "DESCRIPTIVE",
  },
  {
    topic: " Calculus",
    difficulty: "easy",
    marks: "2",
    type: "DESCRIPTIVE",
  },
  {
    topic: " Calculus",
    difficulty: "easy",
    marks: "2",
    type: "DESCRIPTIVE",
  },
  {
    topic: "Relations and Functions",
    difficulty: "hard",
    marks: "1",
    type: "DESCRIPTIVE",
  },
  {
    topic: "Relations and Functions",
    difficulty: "hard",
    marks: "1",
    type: "DESCRIPTIVE",
  },
  {
    topic: "Vectors and 3D Geometry",
    difficulty: "medium",
    marks: "4",
    type: "DESCRIPTIVE",
  },
  {
    topic: "Vectors and 3D Geometry",
    difficulty: "medium",
    marks: "4",
    type: "DESCRIPTIVE",
  },
];

export const USER_PROMPT_GENERATE_QUESTION_PAPER = (config) => {
  return `You are given JSON data in the following format (example shown here, but it can be replaced with similar structure):
{
  "MCQ": [
    {
      "number": 1,
      "question": "What is the value of the limit as x approaches 2 of f(x) = x + 3?",
      "options": {
        "A": "4",
        "B": "5",
        "C": "6",
        "D": "3"
      },
      "correct_answer": "B",
      "explanation": "As x approaches 2, f(x) = 2 + 3 = 5."
    },
    {
      "number": 2,
      "question": "If limₓ→a f(x) = L and limₓ→a g(x) = M, then limₓ→a [f(x) + g(x)] is equal to:",
      "options": {
        "A": "L - M",
        "B": "L + M",
        "C": "L × M",
        "D": "L / M"
      },
      "correct_answer": "B",
      "explanation": "The limit of the sum is the sum of the limits: L + M."
    },
    {
      "number": 3,
      "question": "Determine the limit: limₓ→0 (sin x)/x.",
      "options": {
        "A": "0",
        "B": "1",
        "C": "Undefined",
        "D": "Infinity"
      },
      "correct_answer": "B",
      "explanation": "limₓ→0 (sin x)/x = 1."
    },
  ],
  "DESCRIPTIVE": [
    {
      "number": 13,
      "question": "Evaluate the limit limₓ→3 (2x + 1). Show all steps in your solution.",
      "answer": "Substitute x = 3 into the function: 2(3) + 1 = 7.",
      "explanation": "By directly substituting the value of x, we find that the limit is 7."
    },
    {
      "number": 14,
      "question": "Determine whether the function f(x) = 3x - 5 is continuous at x = 2. Justify your answer.",
      "answer": "The function f(x) = 3x - 5 is continuous at x = 2 because it is a polynomial function, which is continuous everywhere.",
      "explanation": "Polynomial functions do not have breaks, jumps, or asymptotes. Therefore, f(x) is continuous at x = 2."
    },
    {
      "number": 15,
      "question": "A bag contains 4 red, 5 blue, and 6 green marbles. Two marbles are drawn at random without replacement. Calculate the probability that both marbles drawn are of the same color. Show all steps in your solution.",
      "answer": "Probability for red: (4/15) * (3/14) = 12/210\nProbability for blue: (5/15) * (4/14) = 20/210\nProbability for green: (6/15) * (5/14) = 30/210\nTotal probability = (12 + 20 + 30)/210 = 62/210 = 31/105.",
      "explanation": "Calculate the probability for each color separately and then sum them to get the total probability of drawing two marbles of the same color."
    },
    {
      "number": 16,
      "question": "In a standard deck of 52 cards, two cards are drawn consecutively with replacement. Calculate the probability of drawing exactly one Ace. Provide a detailed explanation.",
      "answer": "Probability of first Ace and second not Ace: (4/52) * (48/52) = 192/2704\nProbability of first not Ace and second Ace: (48/52) * (4/52) = 192/2704\nTotal probability = 192/2704 + 192/2704 = 384/2704 = 24/169.",
      "explanation": "Since the draws are with replacement, the probability of drawing an Ace remains the same for both draws. Calculate both scenarios where exactly one Ace is drawn and sum their probabilities."
    }
  ]
}
**Task**: 

1. From the above JSON data, produce exactly two **HTML documents** (as plain text output, not as code blocks):
   - **Document 1 (Question Paper)**: 
     - Has a proper HTML structure (<!DOCTYPE html>, <html>, <head>, <body>).
     - Contains all MCQ questions in an ordered list and descriptive questions in an ordered list (<ol>). 
     - The MCQ and descripttive question should be seperated via sections
     - For each question, show:
       - The question number and text (e.g., "Question 1. Evaluate the limit ...").
       - In case of a Multiple Choice Question, All the multiple-choice options (A, B, C, D).
     - **Do not** show the correct answer or explanation in this first document.

   - **Document 2 (Answer Key)**:
     - Also has a valid HTML structure.
     - Again uses an ordered list for each question.
     - For each question, show:
       - The question number and text.
       - The **correct answer** (e.g., "Correct answer: B").
       - The **explanation** (if any) from the JSON ("Explanation: ...").

2. Make sure the HTML is neatly formatted and self-contained. Return these two HTML documents one after the other in your response, with **no additional explanation**, **no code fences**, and **no markup** beyond the HTML itself.
3. Convert **all** LaTeX expressions (e.g., \\( ... \\), \\[ ... \\]) into suitable **MathML** (or HTML that clearly formats subscripts, superscripts, fractions, etc.) so we can generate a PDF directly from the HTML. Do **not** rely on external libraries like MathJax. 
4. Attaching the data here :- ${config}


**Important**: 
- Do **not** provide any Python code or function definitions. 
- Only output the **two complete HTML documents** (Document 1 = Question Paper, Document 2 = Answer Key). 
- Each document should be fully self-contained, starting with <!DOCTYPE html> and ending with </html>.
- That is all. 
`;
};

export const QUESTION_PAPER_SCHEMA = {
  name: "Question_Paper_Schema",
  schema: {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "QuestionPaperSchema",
    type: "object",
    properties: {
      MCQ: {
        type: "array",
        items: {
          type: "object",
          properties: {
            number: {
              type: "integer",
            },
            question: {
              type: "string",
            },
            options: {
              type: "object",
              properties: {
                A: {
                  type: "string",
                },
                B: {
                  type: "string",
                },
                C: {
                  type: "string",
                },
                D: {
                  type: "string",
                },
              },
              required: ["A", "B", "C", "D"],
              additionalProperties: false,
            },
            correct_answer: {
              type: "string",
              enum: ["A", "B", "C", "D"],
            },
            explanation: {
              type: "string",
            },
          },
          required: [
            "number",
            "question",
            "options",
            "correct_answer",
            "explanation",
          ],
          additionalProperties: false,
        },
      },
      Descriptive: {
        type: "array",
        items: {
          type: "object",
          properties: {
            number: {
              type: "integer",
            },
            question: {
              type: "string",
            },
            solution: {
              type: "string",
            },
            explanation: {
              type: "string",
            },
          },
          required: ["number", "question", "solution", "explanation"],
          additionalProperties: false,
        },
      },
    },
    required: ["MCQ", "Descriptive"],
    additionalProperties: false,
  },
};

export const QUESTION_PAPER_AND_ANSWER_SHEET_SCHEMA = {
  name: "Question_Paper_And_Answer_Sheet_Schema",
  schema: {
    title: "QuestionPaperAndAnswerSheetSchema",
    type: "object",
    properties: {
      QuestionPaper: { type: "string" },
      AnswerSheet: { type: "string" },
    },
  },
};



export function generateContent(response){
  return response.choices?.[0]?.message?.content || "";
}