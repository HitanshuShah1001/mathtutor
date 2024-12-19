export const GENERATE_USER_PROMPT = (
  blueprint
) => `Generate a set of questions based on the following array of objects. Each object specifies the topic, difficulty, marks, and type of the question. Use these details to create questions adhering to the following guidelines:

Question Generation Rules:

The topic key specifies the subject area the question should cover (e.g., Algebra, Relations and Functions). Ensure the question is relevant to the specified topic.
The marks key specifies the weightage of the question. Create questions that reflect the complexity and detail required for the specified marks (e.g., 1 mark for MCQs, 10 marks for descriptive questions).
The type key specifies the question format:
For "MCQ", provide:
A question related to the specified topic.
Four options (labeled A, B, C, D).
Clearly indicate the correct answer (e.g., Correct Answer: A).
For "DESCRIPTIVE", create:
A detailed question that requires a written explanation or calculation. Ensure the depth and complexity match the marks and difficulty level.
The difficulty key determines the complexity of the question:
"EASY": Basic conceptual questions.
"MEDIUM": Questions requiring some application or multi-step reasoning.
"HARD": Challenging questions demanding a deeper understanding of the topic.
Output Format:

Clearly number each question.
Group questions by type:
First, list all "MCQ" questions in sequence.
Then, list all "DESCRIPTIVE" questions in sequence.
Use appropriate headings for "MCQ" and "DESCRIPTIVE" sections.
Output the questions in json format and the answers for each question should be inclduded in the same json object for each question and the chain of thought for that question(explanation for the answer should also be incldued in that json)
Input Array: Use the following input array to generate the questions:
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
