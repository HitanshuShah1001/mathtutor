import React, { useState } from "react";
import { uploadToS3 } from "../utils/s3utils";

const BulkQuestionForm = () => {
  // Initial question object template with fixed grade and subject
  const initialQuestion = {
    type: "mcq", // now lowercase "mcq" by default
    questionText: "",
    marks: 1,
    difficulty: "medium",
    chapter: "Active and passive voice",
    subject: "english", // fixed subject
    grade: 6, // fixed standard is always 6
    repositoryType: "exercise",
    exerciseName: "",
    textBook: "ncert",
    // For descriptive questions: multiple images
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

    // If type changes from mcq to descriptive, clear options.
    if (field === "type" && value === "descriptive") {
      updated[qIndex].options = [];
    }

    // If type changes to mcq, reset options if empty.
    if (
      field === "type" &&
      value === "mcq" &&
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

  // Handler to update a specific option in a mcq question.
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

  // For mcq options: each option gets only one image.
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
      // 1) For each question, upload images for question + images for each option (if mcq).
      const updatedQuestions = await Promise.all(
        questions.map(async (question) => {
          let finalImageUrls = [];

          // If there are imageFiles (descriptive or mcq that stored something?), upload them
          if (question.imageFiles && question.imageFiles.length > 0) {
            const uploadedUrls = await Promise.all(
              question.imageFiles.map(async (file) => {
                const generatedLink = `https://tutor-staffroom-files.s3.amazonaws.com/${Date.now()}-${
                  file.name
                }`;
                return await uploadToS3(file, generatedLink);
              })
            );
            finalImageUrls = [...uploadedUrls];
          }

          // Now handle mcq option images
          let finalOptions = [];
          if (question.type === "mcq" && question.options?.length > 0) {
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
                    imageUrl: uploadedUrl,
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
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWxJZCI6ImhpdGFuc2h1c2hhaDVAZ21haWwuY29tIiwiaWF0IjoxNzQzMTk0ODExLCJleHAiOjE3NDMyODEyMTF9.Z6jscSBnXn5Vjywu9XDIRWNinpTPxaBC6xdVbB5s-M4",
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

  console.log(questions)

  return (
    <div style={{ padding: "0.5rem" }}>
      <h2>Bulk Question Creator</h2>
      <form onSubmit={handleSubmit}>
        {questions.map((question, qIndex) => (
          <div
            key={qIndex}
            style={{
              border: "1px solid #ccc",
              padding: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: "0.5rem",
              }}
            >
              <h4 style={{ margin: 0 }}>Question {qIndex + 1}</h4>
              <button
                type="button"
                onClick={() => {
                  // Optional: remove a question if user wants to
                  const newQuestions = [...questions];
                  newQuestions.splice(qIndex, 1);
                  setQuestions(newQuestions);
                }}
                style={{ fontSize: "0.8rem", padding: "0.2rem 0.4rem" }}
              >
                Remove
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "0.5rem",
              }}
            >
              {/* Question Type */}
              <label style={{ display: "flex", flexDirection: "column" }}>
                Type:
                <select
                  value={question.type}
                  onChange={(e) =>
                    handleQuestionChange(qIndex, "type", e.target.value)
                  }
                  style={{ fontSize: "0.9rem" }}
                >
                  <option value="mcq">mcq</option>
                  <option value="descriptive">descriptive</option>
                </select>
              </label>

              {/* Marks */}
              <label style={{ display: "flex", flexDirection: "column" }}>
                Marks:
                <input
                  type="number"
                  value={question.marks}
                  onChange={(e) =>
                    handleQuestionChange(
                      qIndex,
                      "marks",
                      Number(e.target.value)
                    )
                  }
                  style={{ fontSize: "0.9rem" }}
                />
              </label>

              {/* Difficulty */}
              <label style={{ display: "flex", flexDirection: "column" }}>
                Difficulty:
                <select
                  value={question.difficulty}
                  onChange={(e) =>
                    handleQuestionChange(qIndex, "difficulty", e.target.value)
                  }
                  style={{ fontSize: "0.9rem" }}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>

              {/* Chapter */}
              <label style={{ display: "flex", flexDirection: "column" }}>
                Chapter:
                <input
                  type="text"
                  value={"Active and passive voice"}
                  onChange={(e) =>
                    handleQuestionChange(qIndex, "chapter", e.target.value)
                  }
                  style={{ fontSize: "0.9rem" }}
                />
              </label>

              {/* Subject - Fixed to "Adjectives" */}
              <label style={{ display: "flex", flexDirection: "column" }}>
                Subject:
                <input
                  type="text"
                  value={"english"}
                  readOnly
                  style={{ fontSize: "0.9rem" }}
                />
              </label>

              {/* Grade - Fixed to 6 */}
              <label style={{ display: "flex", flexDirection: "column" }}>
                Grade:
                <input
                  type="number"
                  value={7}
                  readOnly
                  style={{ fontSize: "0.9rem" }}
                />
              </label>

              {/* Repository Type */}
              <label style={{ display: "flex", flexDirection: "column" }}>
                Repo Type:
                <input
                  type="text"
                  value={question.repositoryType}
                  onChange={(e) =>
                    handleQuestionChange(
                      qIndex,
                      "repositoryType",
                      e.target.value
                    )
                  }
                  style={{ fontSize: "0.9rem" }}
                />
              </label>

              {/* Exercise Name */}
              <label style={{ display: "flex", flexDirection: "column" }}>
                Exercise:
                <input
                  type="text"
                  value={question.exerciseName}
                  onChange={(e) =>
                    handleQuestionChange(qIndex, "exerciseName", e.target.value)
                  }
                  style={{ fontSize: "0.9rem" }}
                />
              </label>

              {/* Text Book */}
              <label style={{ display: "flex", flexDirection: "column" }}>
                Text Book:
                <input
                  type="text"
                  value={question.textBook}
                  onChange={(e) =>
                    handleQuestionChange(qIndex, "textBook", e.target.value)
                  }
                  style={{ fontSize: "0.9rem" }}
                />
              </label>
            </div>

            {/* Question Text (below the grid for better width) */}
            <div style={{ marginTop: "0.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.2rem" }}>
                Question Text:
              </label>
              <textarea
                value={question.questionText}
                onChange={(e) =>
                  handleQuestionChange(qIndex, "questionText", e.target.value)
                }
                rows="8"
                style={{ width: "100%", fontSize: "0.9rem" }}
                placeholder="Use $ for math expressions"
              />
            </div>

            {/* If mcq, show options; else show image upload */}
            {question.type === "mcq" ? (
              <div
                style={{
                  marginTop: "0.5rem",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "0.5rem",
                }}
              >
                {question.options.map((option, oIndex) => (
                  <div
                    key={oIndex}
                    style={{
                      border: "1px solid #ccc",
                      padding: "0.5rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    <label style={{ display: "flex", flexDirection: "column" }}>
                      Option {option.key}
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
                        placeholder="Option text ($ for math)"
                        style={{ fontSize: "0.9rem" }}
                      />
                    </label>
                    <label
                      style={{
                        display: "block",
                        marginTop: "0.3rem",
                        fontSize: "0.85rem",
                      }}
                    >
                      Option Image:
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
                        style={{ fontSize: "0.8rem" }}
                      />
                    </label>
                    {option.imageUrl && (
                      <div style={{ marginTop: "0.3rem" }}>
                        <img
                          src={option.imageUrl}
                          alt={`Option ${option.key} preview`}
                          style={{ height: "50px", border: "1px solid #ccc" }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: "0.5rem" }}>
                <label style={{ fontSize: "0.9rem" }}>
                  Upload Images (multiple):
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) =>
                      handleDescriptiveImages(qIndex, e.target.files)
                    }
                    style={{ fontSize: "0.85rem", marginLeft: "0.5rem" }}
                  />
                </label>
                {question.imageUrls && question.imageUrls.length > 0 && (
                  <div style={{ marginTop: "0.3rem" }}>
                    {question.imageUrls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Question ${qIndex + 1} img ${i}`}
                        style={{
                          height: "60px",
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
        <div style={{ marginTop: "0.5rem" }}>
          <button
            type="button"
            onClick={addNewQuestion}
            style={{ fontSize: "0.9rem", marginRight: "1rem" }}
          >
            Add Another Question
          </button>
          <button type="submit" style={{ fontSize: "0.9rem" }}>
            Submit Bulk Questions
          </button>
        </div>
      </form>
    </div>
  );
};

export default BulkQuestionForm;
