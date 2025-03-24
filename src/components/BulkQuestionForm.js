import React, { useState } from "react";

const BulkQuestionForm = () => {
  // Initial question object template.
  const initialQuestion = {
    type: "MCQ", // or "Descriptive"
    questionText: "",
    marks: 0,
    difficulty: "medium",
    chapter: "Sorting Materials Into Groups",
    subject: "Science",
    // For Descriptive questions: can have multiple images.
    imageUrls: [],
    // For MCQs: options with single image per option.
    options: [
      { key: "1", option: "", imageUrl: "" },
      { key: "2", option: "", imageUrl: "" },
      { key: "3", option: "", imageUrl: "" },
      { key: "4", option: "", imageUrl: "" },
    ],
  };

  // State to hold an array of questions
  const [questions, setQuestions] = useState([initialQuestion]);
  console.log(questions)
  // Handler to update a field of a question.
  const handleQuestionChange = (qIndex, field, value) => {
    console.log(qIndex,field,value)
    const updated = [...questions];
    updated[qIndex][field] = value;
    // If type changes from MCQ to Descriptive, you may want to clear options.
    if (field === "type" && value === "Descriptive") {
      updated[qIndex].options = [];
    }
    // If type changes to MCQ, reset options if empty.
    if (
      field === "type" &&
      value === "MCQ" &&
      updated[qIndex].options.length === 0
    ) {
      updated[qIndex].options = [
        { key: "1", option: "", imageUrl: "" },
        { key: "2", option: "", imageUrl: "" },
        { key: "3", option: "", imageUrl: "" },
        { key: "4", option: "", imageUrl: "" },
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
    // For demo purposes, we use URL.createObjectURL; in production you might upload the file.
    const urls = Array.from(files).map((file) => URL.createObjectURL(file));
    const updated = [...questions];
    updated[qIndex].imageUrls = urls;
    setQuestions(updated);
  };

  // For MCQ options: each option gets only one image.
  const handleOptionImageUpload = (qIndex, optionIndex, file) => {
    const url = URL.createObjectURL(file);
    handleOptionChange(qIndex, optionIndex, "imageUrl", url);
  };

  // Add a new question form.
  const addNewQuestion = () => {
    setQuestions([...questions, { ...initialQuestion }]);
  };

  // On form submission, compile the payload and call the API
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { questions };
    try {
      const response = await fetch(
        "http://localhost:3000/question/create-bulk",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWxJZCI6ImhpdGFuc2h1c2hhaDVAZ21haWwuY29tIiwiaWF0IjoxNzQyNzI0MTM4LCJleHAiOjE3NDI4MTA1Mzh9.lS46iNfpgKCI_hVb9dXkVJ1ZiuOM-RsIXpn6szMTM6U",
          },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("API Response:", data);
      // Optionally, handle success (e.g., clear form or show a message)
    } catch (error) {
      console.error("Error submitting bulk questions:", error);
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
            <label>
              Chapter:{" "}
              <input
                type="text"
                value={"Sorting Materials Into Groups"}
                onChange={(e) =>
                  handleQuestionChange(qIndex, "chapter", e.target.value)
                }
              />
            </label>
            <br />
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
