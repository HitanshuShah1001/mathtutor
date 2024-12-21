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
