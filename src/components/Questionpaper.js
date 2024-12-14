import React, { useState, useEffect } from "react";
import { openai } from "./InitOpenAI";
import { jsPDF } from "jspdf"; // Import jsPDF
import { ChatHeader } from "./ChatHeader";

const GenerateQuestionPaper = () => {
  const [standard, setStandard] = useState("");
  const [subject, setSubject] = useState("");
  const [topics, setTopics] = useState([]);
  const [customTopic, setCustomTopic] = useState("");
  const [marks, setMarks] = useState("");
  const [mcqs, setMcqs] = useState("");
  const [anyotherQuery, setAnyOtherQuery] = useState("");
  const [responseText, setResponseText] = useState("");
  const [isLoading, setIsLoading] = useState(false); // State to track loading

  // topicsConfig will hold detailed config for each topic
  // Structure:
  // {
  //   topicName: {
  //     easyMCQs: number,
  //     mediumMCQs: number,
  //     hardMCQs: number,
  //     mcqMarks: number,
  //     descCount: number,
  //     descDifficulties: ["easy","medium","hard",...] length = descCount
  //     descMarksPerQuestion: [number, number, ...] length = descCount
  //   }
  // }
  const [topicsConfig, setTopicsConfig] = useState({});

  // Demo topics
  const allTopics = {
    science: {
      1: ["Living and Non-living", "Basic Shapes in Nature"],
      2: ["Plants and Their Uses", "Types of Animals"],
      3: ["Solar System Basics", "Simple Machines"],
      4: ["Food and Nutrition", "Environmental Pollution"],
      5: ["Human Body Systems", "States of Matter"],
      6: ["Electricity and Circuits", "Respiration in Plants"],
      7: ["Acids and Bases", "Heat and Temperature"],
      8: ["Light and Sound", "Cell Structure"],
      9: ["Atoms and Molecules", "Ecosystems"],
      10: ["Genetics Basics", "Newton's Laws"],
      11: ["Chemical Reactions", "Electromagnetism"],
      12: ["Organic Chemistry", "Modern Physics"],
    },
    maths: {
      1: ["Counting and Numbers", "Basic Shapes"],
      2: ["Addition and Subtraction", "Measurement Basics"],
      3: ["Multiplication and Division", "Patterns and Sequences"],
      4: ["Fractions", "Basic Geometry"],
      5: ["Decimals", "Angles and Triangles"],
      6: ["Ratios and Proportions", "Integers"],
      7: ["Algebraic Expressions", "Coordinate Geometry"],
      8: ["Linear Equations", "Data Handling"],
      9: ["Polynomials", "Trigonometry Basics"],
      10: ["Quadratic Equations", "Circles"],
      11: ["Limits and Continuity", "Probability"],
      12: ["Differential Calculus", "Integral Calculus"],
    },
  };

  useEffect(() => {
    if (standard && subject) {
      const topicList = allTopics[subject][standard] || [];
      setTopics(topicList);
      // Reset selected topics and configs
      setTopicsConfig({});
    } else {
      setTopics([]);
      setTopicsConfig({});
    }
  }, [subject, standard]);

  const addTopic = (topic) => {
    setTopicsConfig((prev) => {
      if (!prev[topic]) {
        return {
          ...prev,
          [topic]: {
            easyMCQs: 0,
            mediumMCQs: 0,
            hardMCQs: 0,
            mcqMarks: 1,
            descCount: 0,
            descDifficulties: [],
            descMarksPerQuestion: [],
          },
        };
      }
      return prev;
    });
  };

  const handleAddTopicFromDropdown = (topic) => {
    if (topic && !topicsConfig[topic]) {
      addTopic(topic);
    }
  };

  const handleAddCustomTopic = () => {
    if (customTopic.trim() && !topicsConfig[customTopic.trim()]) {
      addTopic(customTopic.trim());
      setCustomTopic("");
    }
  };

  const handleRemoveTopic = (topicToRemove) => {
    setTopicsConfig((prev) => {
      const newConfig = { ...prev };
      delete newConfig[topicToRemove];
      return newConfig;
    });
  };

  const handleTopicChange = (topic, field, value) => {
    setTopicsConfig((prev) => {
      const updated = { ...prev[topic], [field]: value };
      // If descCount changed, adjust descDifficulties and descMarksPerQuestion arrays length
      if (field === "descCount") {
        const count = parseInt(value, 10) || 0;
        let descDiff = updated.descDifficulties || [];
        let descMarksArr = updated.descMarksPerQuestion || [];

        if (count > descDiff.length) {
          // Add more difficulties defaulting to "easy"
          descDiff = [
            ...descDiff,
            ...Array(count - descDiff.length).fill("easy"),
          ];
          descMarksArr = [
            ...descMarksArr,
            ...Array(count - descMarksArr.length).fill(1),
          ];
        } else if (count < descDiff.length) {
          // Remove extra difficulties and marks
          descDiff = descDiff.slice(0, count);
          descMarksArr = descMarksArr.slice(0, count);
        }
        updated.descDifficulties = descDiff;
        updated.descMarksPerQuestion = descMarksArr;
      }

      return { ...prev, [topic]: updated };
    });
  };

  const handleDescDifficultyChange = (topic, index, difficulty) => {
    setTopicsConfig((prev) => {
      const updated = { ...prev[topic] };
      updated.descDifficulties[index] = difficulty;
      return { ...prev, [topic]: updated };
    });
  };

  const handleDescMarksChange = (topic, index, markValue) => {
    setTopicsConfig((prev) => {
      const updated = { ...prev[topic] };
      updated.descMarksPerQuestion[index] = markValue;
      return { ...prev, [topic]: updated };
    });
  };

  const generatePrompt = () => {
    // Construct a detailed prompt with the topicsConfig
    const topicsDetails = Object.entries(topicsConfig)
      .map(([topic, config]) => {
        // Construct a string for descriptive questions
        const descDetails = config.descDifficulties
          .map((diff, i) => {
            return `    Q${i + 1}: Difficulty - ${diff}, Marks: ${
              config.descMarksPerQuestion[i]
            }`;
          })
          .join("\n");

        return `Topic: ${topic}
  MCQs -> Easy: ${config.easyMCQs}, Medium: ${config.mediumMCQs}, Hard: ${config.hardMCQs}, MCQ Marks Each: ${config.mcqMarks}
  Descriptive Questions: ${config.descCount}
${descDetails}`;
      })
      .join("\n\n");

    return `Generate a question paper for:
Standard: ${standard}
Subject: ${subject.charAt(0).toUpperCase() + subject.slice(1)}
Total Marks: ${marks}
Number of MCQs: ${mcqs}
Additional input: ${anyotherQuery}

Topic Details:
${topicsDetails}

Instructions: Create a well-structured and balanced question paper, ensuring topics are proportionally represented. Consider the specified MCQ difficulties and descriptive question difficulties for each topic, and use the given marks per question.`;
  };

  const generateQuestionPaper = async () => {
    try {
      setIsLoading(true);
      const prompt = generatePrompt();
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
      });

      const content = response.choices?.[0]?.message?.content || "";
      setResponseText(content);
    } catch (e) {
      console.log("error occurred", e);
    } finally {
      setIsLoading(false); // Hide loader after response
    }
  };

  const generatePDF = () => {
    if (!responseText) return;

    const doc = new jsPDF({
      orientation: "p",
      unit: "pt",
      format: "A4",
    });

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(12);

    const lines = doc.splitTextToSize(responseText, 500);
    doc.text(lines, 50, 50);
    doc.save("question-paper.pdf");
  };

  const selectedTopics = Object.keys(topicsConfig);

  return (
    <>
      <ChatHeader title={"Generate Question Paper"} />
      <div style={styles.container}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Select Standard</label>
          <select
            style={styles.select}
            value={standard}
            onChange={(e) => setStandard(e.target.value)}
          >
            <option value="">--Select--</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Select Subject</label>
          <select
            style={styles.select}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="">--Select--</option>
            <option value="science">Science</option>
            <option value="maths">Maths</option>
          </select>
        </div>

        {/* {topics.length > 0 && (
          <div style={styles.formGroup}>
            <label style={styles.label}>Select Topics to Include</label>
            <select
              style={styles.select}
              onChange={(e) => {
                if (e.target.value) handleAddTopicFromDropdown(e.target.value);
              }}
            >
              <option value="">--Select Topic--</option>
              {topics.map((t, idx) => (
                <option key={idx} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )} */}

        <div style={styles.formGroup}>
          <label style={styles.label}>Or Add a Custom Topic</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              style={styles.input}
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Enter custom topic"
            />
            <button
              style={styles.generateButton}
              onClick={handleAddCustomTopic}
            >
              Add Topic
            </button>
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Select Topics to Include</label>
          <div style={styles.topicSelectContainer}>
            <select
              style={styles.select}
              onChange={(e) => {
                if (e.target.value) handleAddTopicFromDropdown(e.target.value);
              }}
            >
              <option value="">--Select Topic--</option>
              {topics.map((t, idx) => (
                <option key={idx} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedTopics.length > 0 && (
          <div style={styles.selectedTopicsContainer}>
            {selectedTopics.map((topic, idx) => (
              <div style={styles.topicChip} key={idx}>
                {topic}
                <button
                  style={styles.removeButton}
                  onClick={() => handleRemoveTopic(topic)}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedTopics.length > 0 && (
          <div style={styles.topicConfigContainer}>
            <h2 style={styles.subTitle}>Configure Topics</h2>
            {selectedTopics.map((topic) => {
              const config = topicsConfig[topic] || {};
              return (
                <div key={topic} style={styles.topicConfig}>
                  <div style={styles.topicHeader}>
                    <h3 style={styles.topicTitle}>{topic}</h3>
                    <button
                      style={styles.removeButton}
                      onClick={() => handleRemoveTopic(topic)}
                    >
                      &times;
                    </button>
                  </div>
                  <div style={styles.topicFormGroup}>
                    <label style={styles.label}>Easy MCQs</label>
                    <input
                      type="number"
                      style={styles.input}
                      value={config.easyMCQs}
                      onChange={(e) =>
                        handleTopicChange(
                          topic,
                          "easyMCQs",
                          parseInt(e.target.value, 10) || 0
                        )
                      }
                      onWheel={(e) => e.preventDefault()}
                    />
                  </div>
                  <div style={styles.topicFormGroup}>
                    <label style={styles.label}>Medium MCQs</label>
                    <input
                      type="number"
                      style={styles.input}
                      value={config.mediumMCQs}
                      onChange={(e) =>
                        handleTopicChange(
                          topic,
                          "mediumMCQs",
                          parseInt(e.target.value, 10) || 0
                        )
                      }
                      onWheel={(e) => e.preventDefault()}
                    />
                  </div>
                  <div style={styles.topicFormGroup}>
                    <label style={styles.label}>Hard MCQs</label>
                    <input
                      type="number"
                      style={styles.input}
                      value={config.hardMCQs}
                      onChange={(e) =>
                        handleTopicChange(
                          topic,
                          "hardMCQs",
                          parseInt(e.target.value, 10) || 0
                        )
                      }
                      onWheel={(e) => e.preventDefault()}
                    />
                  </div>
                  <div style={styles.topicFormGroup}>
                    <label style={styles.label}>Marks per MCQ</label>
                    <input
                      type="number"
                      style={styles.input}
                      value={config.mcqMarks || 1}
                      onChange={(e) =>
                        handleTopicChange(
                          topic,
                          "mcqMarks",
                          parseInt(e.target.value, 10) || 1
                        )
                      }
                      onWheel={(e) => e.preventDefault()}
                    />
                  </div>
                  <div style={styles.topicFormGroup}>
                    <label style={styles.label}>
                      Number of Descriptive Questions
                    </label>
                    <input
                      type="number"
                      style={styles.input}
                      value={config.descCount}
                      onChange={(e) =>
                        handleTopicChange(
                          topic,
                          "descCount",
                          parseInt(e.target.value, 10) || 0
                        )
                      }
                      onWheel={(e) => e.preventDefault()}
                    />
                  </div>

                  {config.descCount > 0 && (
                    <div style={{ marginTop: "1rem" }}>
                      <h4 style={styles.subTitle}>
                        Descriptive Questions Configuration
                      </h4>
                      {config.descDifficulties?.map((diff, i) => (
                        <div key={i} style={styles.topicFormGroup}>
                          <label style={styles.label}>
                            Question {i + 1} Difficulty
                          </label>
                          <select
                            style={styles.select}
                            value={diff}
                            onChange={(e) =>
                              handleDescDifficultyChange(
                                topic,
                                i,
                                e.target.value
                              )
                            }
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>

                          <label style={styles.label}>
                            Marks for Question {i + 1}
                          </label>
                          <input
                            type="number"
                            style={styles.input}
                            value={config.descMarksPerQuestion[i]}
                            onChange={(e) =>
                              handleDescMarksChange(
                                topic,
                                i,
                                parseInt(e.target.value, 10) || 1
                              )
                            }
                            onWheel={(e) => e.preventDefault()}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={styles.formGroup}>
          <label style={styles.label}>Total Marks</label>
          <input
            type="number"
            style={styles.input}
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
            placeholder="e.g. 100"
            onWheel={(e) => e.preventDefault()}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Number of MCQs (optional)</label>
          <input
            type="number"
            style={styles.input}
            value={mcqs}
            onChange={(e) => setMcqs(e.target.value)}
            placeholder="e.g. 10"
            onWheel={(e) => e.preventDefault()}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Any other query</label>
          <input
            type="text"
            style={styles.input}
            value={anyotherQuery}
            onChange={(e) => setAnyOtherQuery(e.target.value)}
            placeholder="Mark problems as section A"
            onWheel={(e) => e.preventDefault()}
          />
        </div>

        <button
          style={styles.generateButton}
          onClick={generateQuestionPaper}
          disabled={!standard || !subject || !marks || isLoading}
        >
          {isLoading ? "Loading..." : "Generate Prompt"}
        </button>

        {responseText && (
          <div style={styles.resultContainer}>
            <h2 style={styles.subTitle}>Preview Generated Question Paper</h2>
            <pre style={styles.responsePre}>{responseText}</pre>
            <button style={styles.generateButton} onClick={generatePDF}>
              Download PDF
            </button>
          </div>
        )}
      </div>
    </>
  );
};

const styles = {
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "1.5rem",
    fontFamily: "'Helvetica Neue', sans-serif",
    color: "#333",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: "1.5rem",
    color: "#2c3e50",
  },
  subTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    marginBottom: "1rem",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    fontSize: "1rem",
    fontWeight: "500",
    marginBottom: "0.25rem",
    color: "#2c3e50",
  },
  select: {
    padding: "0.5rem",
    fontSize: "1rem",
    border: "1px solid #ccc",
    borderRadius: "4px",
    outline: "none",
    background: "#fff",
    cursor: "pointer",
  },
  topicSelectContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  topicConfigContainer: {
    marginTop: "2rem",
    borderTop: "1px solid #ccc",
    paddingTop: "1rem",
  },
  topicConfig: {
    border: "1px solid #ccc",
    borderRadius: "4px",
    padding: "1rem",
    marginBottom: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  topicHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topicTitle: {
    fontSize: "1.15rem",
    fontWeight: "600",
    margin: 0,
  },
  selectedTopicsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    marginTop: "0.5rem",
  },
  topicChip: {
    background: "#e0f7fa",
    padding: "0.5rem 0.75rem",
    borderRadius: "20px",
    display: "inline-flex",
    alignItems: "center",
    fontSize: "0.9rem",
    fontWeight: "500",
    color: "#006064",
  },
  removeButton: {
    marginLeft: "0.5rem",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1.5rem",
    color: "#e74c3c",
    fontWeight: "bold",
    padding: "0 0.5rem",
  },
  input: {
    padding: "0.5rem",
    fontSize: "1rem",
    border: "1px solid #ccc",
    borderRadius: "4px",
    outline: "none",
  },
  generateButton: {
    background: "#1abc9c",
    color: "#fff",
    border: "none",
    padding: "0.75rem 1rem",
    fontSize: "1rem",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "background 0.3s",
  },
  resultContainer: {
    marginTop: "2rem",
  },
  responsePre: {
    background: "#f4f4f4",
    padding: "1rem",
    borderRadius: "4px",
    whiteSpace: "pre-wrap",
    fontFamily: "monospace",
    fontSize: "0.95rem",
    marginBottom: "1rem",
  },
  topicFormGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
};

export default GenerateQuestionPaper;
