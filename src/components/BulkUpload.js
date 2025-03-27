import React, { useState } from "react";
import { uploadToS3 } from "../utils/s3utils";

const BulkQuestionForm = () => {
  // Initial question object template.
  const initialQuestion = {
    type: "MCQ", // or "Descriptive"
    questionText: "",
    marks: 0,
    difficulty: "medium",
    chapter: "Sorting Materials Into Groups",
    subject: "Science",
    grade: 12,
    repositoryType: "exercise",
    exerciseName: "Exercise 1.1",
    textBook: "gseb",
    // For Descriptive questions: multiple images
    imageUrls: [],
    // We'll store the actual file references here so we can upload them:
    imageFiles: [],
    // For MCQs: options with single image per option.
    options: [
      { key: "1", option: "", imageUrl: "", imageFile: null },
      { key: "2", option: "", imageUrl: "", imageFile: null },
      { key: "3", option: "", imageUrl: "", imageFile: null },
      { key: "4", option: "", imageUrl: "", imageFile: null },
    ],
  };

  // State to hold an array of questions
  const [questions, setQuestions] = useState([initialQuestion]);

  // Handler to update a field of a question.
  const handleQuestionChange = (qIndex, field, value) => {
    const updated = [...questions];
    updated[qIndex][field] = value;

    // If type changes from MCQ to Descriptive, clear options.
    if (field === "type" && value === "Descriptive") {
      updated[qIndex].options = [];
      // Also clear out any MCQ-specific imageFile references
    }

    // If type changes to MCQ, reset options if empty.
    if (
      field === "type" &&
      value === "MCQ" &&
      updated[qIndex].options.length === 0
    ) {
      updated[qIndex].options = [
        { key: "1", option: "", imageUrl: "", imageFile: null },
        { key: "2", option: "", imageUrl: "", imageFile: null },
        { key: "3", option: "", imageUrl: "", imageFile: null },
        { key: "4", option: "", imageUrl: "", imageFile: null },
      ];
    }

    setQuestions(updated);
  };

  // Handler to update a specific option in a MCQ question.
  const handleOptionChange = (qIndex, optionIndex, field, value) => {
    const updated = [...questions];
    updated[qIndex].options[optionIndex][field] = value;
    setQuestions(updated);
  };

  // For descriptive questions: accept multiple files
  const handleDescriptiveImages = (qIndex, files) => {
    const updated = [...questions];
    const fileList = Array.from(files);

    // Store the actual file references for S3 upload
    updated[qIndex].imageFiles = fileList;

    // For local preview in the UI only:
    const previewUrls = fileList.map((file) => URL.createObjectURL(file));
    updated[qIndex].imageUrls = previewUrls;

    setQuestions(updated);
  };

  // For MCQ options: each option gets only one image.
  const handleOptionImageUpload = (qIndex, optionIndex, file) => {
    const updated = [...questions];
    // For local display
    const url = URL.createObjectURL(file);
    updated[qIndex].options[optionIndex].imageUrl = url;
    // Store the file reference for uploading
    updated[qIndex].options[optionIndex].imageFile = file;
    setQuestions(updated);
  };

  // Add a new question form.
  const addNewQuestion = () => {
    setQuestions([...questions, { ...initialQuestion }]);
  };

  // On form submission, compile the payload, upload images to S3, then call the API
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 1) For each question, upload images for question + images for each option (if MCQ).
      const updatedQuestions = await Promise.all(
        questions.map(async (question) => {
          let finalImageUrls = [];

          // If there are imageFiles (descriptive or MCQ that stored something?), upload them
          if (question.imageFiles && question.imageFiles.length > 0) {
            const uploadedUrls = await Promise.all(
              question.imageFiles.map(async (file) => {
                // You can customize the generatedLink
                const generatedLink = `https://tutor-staffroom-files.s3.amazonaws.com/${Date.now()}-${
                  file.name
                }`;
                return await uploadToS3(file, generatedLink);
              })
            );
            finalImageUrls = [...uploadedUrls];
          }

          // Now handle MCQ option images
          let finalOptions = [];
          if (question.type === "MCQ" && question.options?.length > 0) {
            finalOptions = await Promise.all(
              question.options.map(async (opt) => {
                // If the user attached a real file
                if (opt.imageFile) {
                  const generatedLink = `https://tutor-staffroom-files.s3.amazonaws.com/${Date.now()}-${
                    opt.imageFile.name
                  }`;
                  const uploadedUrl = await uploadToS3(
                    opt.imageFile,
                    generatedLink
                  );
                  return {
                    ...opt,
                    // The S3 URL
                    imageUrl: uploadedUrl,
                    // Remove the file reference from final payload
                    imageFile: undefined,
                  };
                } else {
                  // If no file was attached, just return as is
                  return { ...opt };
                }
              })
            );
          } else {
            finalOptions = question.options || [];
          }

          return {
            ...question,
            imageUrls: finalImageUrls,
            imageFiles: undefined, // remove the local file references
            options: finalOptions,
            // Ensure difficulty is in correct form, e.g. lowercased:
            difficulty: question.difficulty.toLowerCase(),
          };
        })
      );

      // 2) Submit the final payload
      const payload = { questions: updatedQuestions };
      const response = await fetch(
        "http://localhost:3000/question/create-bulk",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWxJZCI6ImhpdGFuc2h1c2hhaDVAZ21haWwuY29tIiwiaWF0IjoxNzQyODE1NDQwLCJleHAiOjE3NDI5MDE4NDB9.rAYPi-ndE5uY04jZsXU6YUXCwNyWDguBxtipjpy8pjE",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("API Response:", data);
      alert("Questions submitted successfully!");

      // Optionally, reset the form
      setQuestions([initialQuestion]);
    } catch (error) {
      console.error("Error submitting bulk questions:", error);
      alert("Failed to submit questions. Check console for details.");
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Bulk Question Creator</h2>
      <form onSubmit={handleSubmit}>
        {questions.map((question, qIndex) => (
          <div
            key={qIndex}
            style={{
              border: "1px solid #ccc",
              padding: "1rem",
              marginBottom: "1rem",
            }}
          >
            <h3>Question {qIndex + 1}</h3>

            {/* Question Type */}
            <label>
              Question Type:{" "}
              <select
                value={question.type}
                onChange={(e) =>
                  handleQuestionChange(qIndex, "type", e.target.value)
                }
              >
                <option value="MCQ">MCQ</option>
                <option value="Descriptive">Descriptive</option>
              </select>
            </label>
            <br />

            {/* Question Text */}
            <label>
              Question Text:
              <textarea
                value={question.questionText}
                onChange={(e) =>
                  handleQuestionChange(qIndex, "questionText", e.target.value)
                }
                rows="4"
                style={{ width: "100%" }}
                placeholder="Enter question text (use $ to wrap math expressions)"
              />
            </label>
            <br />

            {/* Marks */}
            <label>
              Marks:{" "}
              <input
                type="number"
                value={question.marks}
                onChange={(e) =>
                  handleQuestionChange(qIndex, "marks", Number(e.target.value))
                }
              />
            </label>
            <br />

            {/* Difficulty */}
            <label>
              Difficulty:{" "}
              <select
                value={question.difficulty}
                onChange={(e) =>
                  handleQuestionChange(qIndex, "difficulty", e.target.value)
                }
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>
            <br />

            {/* Chapter */}
            <label>
              Chapter:{" "}
              <input
                type="text"
                value={question.chapter}
                onChange={(e) =>
                  handleQuestionChange(qIndex, "chapter", e.target.value)
                }
              />
            </label>
            <br />

            {/* Subject */}
            <label>
              Subject:{" "}
              <input
                type="text"
                value={question.subject}
                onChange={(e) =>
                  handleQuestionChange(qIndex, "subject", e.target.value)
                }
              />
            </label>
            <br />

            {/* Grade */}
            <label>
              Grade:{" "}
              <input
                type="number"
                value={question.grade}
                onChange={(e) =>
                  handleQuestionChange(qIndex, "grade", Number(e.target.value))
                }
              />
            </label>
            <br />

            {/* Repository Type */}
            <label>
              Repository Type:{" "}
              <input
                type="text"
                value={question.repositoryType}
                onChange={(e) =>
                  handleQuestionChange(qIndex, "repositoryType", e.target.value)
                }
              />
            </label>
            <br />

            {/* Exercise Name */}
            <label>
              Exercise Name:{" "}
              <input
                type="text"
                value={question.exerciseName}
                onChange={(e) =>
                  handleQuestionChange(qIndex, "exerciseName", e.target.value)
                }
              />
            </label>
            <br />

            {/* Text Book */}
            <label>
              Text Book:{" "}
              <input
                type="text"
                value={question.textBook}
                onChange={(e) =>
                  handleQuestionChange(qIndex, "textBook", e.target.value)
                }
              />
            </label>
            <br />

            {question.type === "MCQ" ? (
              <div style={{ marginTop: "1rem" }}>
                <h4>Options</h4>
                {question.options.map((option, oIndex) => (
                  <div key={oIndex} style={{ marginBottom: "0.5rem" }}>
                    <label>
                      Option {option.key}:{" "}
                      <input
                        type="text"
                        value={option.option}
                        onChange={(e) =>
                          handleOptionChange(
                            qIndex,
                            oIndex,
                            "option",
                            e.target.value
                          )
                        }
                        placeholder="Enter option text (wrap math with $)"
                      />
                    </label>
                    <br />
                    <label>
                      Option Image:{" "}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleOptionImageUpload(
                            qIndex,
                            oIndex,
                            e.target.files[0]
                          )
                        }
                      />
                    </label>
                    {/* Preview if available */}
                    {option.imageUrl && (
                      <div style={{ marginTop: "0.5rem" }}>
                        <img
                          src={option.imageUrl}
                          alt={`Option ${option.key} preview`}
                          style={{ height: "60px", border: "1px solid #ccc" }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: "1rem" }}>
                <h4>Upload Question Images (multiple allowed)</h4>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) =>
                    handleDescriptiveImages(qIndex, e.target.files)
                  }
                />
                {question.imageUrls && question.imageUrls.length > 0 && (
                  <div style={{ marginTop: "0.5rem" }}>
                    {question.imageUrls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Question ${qIndex + 1} img ${i}`}
                        style={{
                          height: "100px",
                          marginRight: "5px",
                          border: "1px solid #ccc",
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <button type="button" onClick={addNewQuestion}>
          Add Another Question
        </button>
        <br />
        <br />
        <button type="submit">Submit Bulk Questions</button>
      </form>
    </div>
  );
};

export default BulkQuestionForm;
