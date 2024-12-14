import React, { useState, useEffect, useCallback } from "react";
import { openai } from "./InitOpenAI";
import { jsPDF } from "jspdf"; // Import jsPDF
import { ChatHeader } from "./ChatHeader";
import { styles } from "../Questionpaperstyles";

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
  const [topicsConfig, setTopicsConfig] = useState({});
  const [easyMCQMarks, setEasyMCQMarks] = useState(1);
  const [mediumMCQMarks, setMediumMCQMarks] = useState(2);
  const [hardMCQMarks, setHardMCQMarks] = useState(4);
  const [easyDescMarks, setEasyDescMarks] = useState(1);
  const [mediumDescMarks, setMediumDescMarks] = useState(2);
  const [hardDescMarks, setHardDescMarks] = useState(4);

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
            descEasy: 0,
            descMedium: 0,
            descHard: 0,
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

  const RenderTopicSelection = useCallback(() => {
    return (
      <div style={styles.formGroup}>
        <label style={styles.label}>Select Topics</label>
        <div style={styles.topicSelectionContainer}>
          <select
            style={styles.select}
            onChange={(e) => {
              if (e.target.value) handleAddTopicFromDropdown(e.target.value);
            }}
          >
            <option value="">Choose a Topic</option>
            {topics.map((t, idx) => (
              <option key={idx} value={t} disabled={!!topicsConfig[t]}>
                {t} {topicsConfig[t] ? "✓" : ""}
              </option>
            ))}
          </select>

          <div style={styles.customTopicContainer}>
            <input
              type="text"
              style={styles.inputInline}
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Or add custom topic"
            />
            <button style={styles.addButton} onClick={handleAddCustomTopic}>
              +
            </button>
          </div>
        </div>

        {/* Selected Topics Chips */}
        {Object.keys(topicsConfig).length > 0 && (
          <div style={styles.selectedTopicsChips}>
            {Object.keys(topicsConfig).map((topic) => (
              <div key={topic} style={styles.topicChip}>
                {topic}
                <button
                  style={styles.chipRemoveButton}
                  onClick={() => handleRemoveTopic(topic)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }, [topicsConfig, topics, customTopic]); // Dependencies

  return (
    <div style={styles.pageContainer}>
      <ChatHeader title={"Generate Question Paper"} />
      <div style={styles.container}>
        <div style={styles.formContainer}>
          <div style={styles.columnLeft}>
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Exam Details</h2>

              <div style={styles.formGroup}>
                <label style={styles.label}>Standard</label>
                <select
                  style={styles.select}
                  value={standard}
                  onChange={(e) => setStandard(e.target.value)}
                >
                  <option value="">Select Standard</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Subject</label>
                <select
                  style={styles.select}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  <option value="">Select Subject</option>
                  <option value="science">Science</option>
                  <option value="maths">Maths</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Total Marks</label>
                <input
                  type="number"
                  style={styles.input}
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  placeholder="e.g. 100"
                />
              </div>

              {/* <div style={styles.formGroup}>
                <label style={styles.label}>Number of MCQs</label>
                <input
                  type="number"
                  style={styles.input}
                  value={mcqs}
                  onChange={(e) => setMcqs(e.target.value)}
                  placeholder="e.g. 10"
                />
              </div> */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Weightage for MCQs (Marks)</label>
                <div style={styles.weightageContainer}>
                  <div style={styles.weightageBox}>
                    <label>Easy</label>
                    <input
                      type="number"
                      style={styles.inputSmall}
                      placeholder="e.g. 1"
                      value={easyMCQMarks}
                      onChange={(e) => setEasyMCQMarks(e.target.value)}
                    />
                  </div>
                  <div style={styles.weightageBox}>
                    <label>Medium</label>
                    <input
                      type="number"
                      style={styles.inputSmall}
                      value={mediumMCQMarks}
                      placeholder="e.g. 2"
                      onChange={(e) => setMediumMCQMarks(e.target.value)}
                    />
                  </div>
                  <div style={styles.weightageBox}>
                    <label>Hard</label>
                    <input
                      type="number"
                      style={styles.inputSmall}
                      value={hardMCQMarks}
                      placeholder="e.g. 4"
                      onChange={(e) => setHardMCQMarks(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Weightage for Descriptive (Marks)
                </label>
                <div style={styles.weightageContainer}>
                  <div style={styles.weightageBox}>
                    <label>Easy</label>
                    <input
                      type="number"
                      style={styles.inputSmall}
                      value={easyDescMarks}
                      placeholder="e.g. 1"
                      onChange={(e) => setEasyDescMarks(e.target.value)}
                    />
                  </div>
                  <div style={styles.weightageBox}>
                    <label>Medium</label>
                    <input
                      type="number"
                      value={mediumDescMarks}
                      style={styles.inputSmall}
                      placeholder="e.g. 2"
                      onChange={(e) => setMediumDescMarks(e.target.value)}
                    />
                  </div>
                  <div style={styles.weightageBox}>
                    <label>Hard</label>
                    <input
                      type="number"
                      style={styles.inputSmall}
                      placeholder="e.g. 4"
                      value={hardDescMarks}
                      onChange={(e) => setHardDescMarks(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Additional Instructions</label>
                <input
                  type="text"
                  style={styles.input}
                  value={anyotherQuery}
                  onChange={(e) => setAnyOtherQuery(e.target.value)}
                  placeholder="e.g. Mark problems as section A"
                />
              </div>
            </div>
          </div>

          <div style={styles.columnRight}>
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Topic Configuration</h2>

              {topics.length > 0 && <RenderTopicSelection />}

              {Object.keys(topicsConfig).length > 0 && (
                <div style={styles.topicConfigDetails}>
                  {Object.entries(topicsConfig).map(([topic, config]) => (
                    <div key={topic} style={styles.topicConfigCard}>
                      <div style={styles.topicConfigHeader}>
                        <h3 style={styles.topicConfigTitle}>{topic}</h3>
                        <button
                          style={styles.removeTopicButton}
                          onClick={() => handleRemoveTopic(topic)}
                        >
                          Remove
                        </button>
                      </div>

                      <div style={styles.topicConfigGrid}>
                        <div style={styles.formGroupInline}>
                          <label>Easy MCQs</label>
                          <input
                            style={styles.inputSmall}
                            value={config.easyMCQs}
                            onChange={(e) =>
                              handleTopicChange(
                                topic,
                                "easyMCQs",
                                parseInt(e.target.value, 10) || 0
                              )
                            }
                          />
                        </div>
                        <div style={styles.formGroupInline}>
                          <label>Medium MCQs</label>
                          <input
                            style={styles.inputSmall}
                            value={config.mediumMCQs}
                            onChange={(e) =>
                              handleTopicChange(
                                topic,
                                "mediumMCQs",
                                parseInt(e.target.value, 10) || 0
                              )
                            }
                          />
                        </div>
                        <div style={styles.formGroupInline}>
                          <label>Hard MCQs</label>
                          <input
                            style={styles.inputSmall}
                            value={config.hardMCQs}
                            onChange={(e) =>
                              handleTopicChange(
                                topic,
                                "hardMCQs",
                                parseInt(e.target.value, 10) || 0
                              )
                            }
                          />
                        </div>
                        <div style={styles.formGroupInline}>
                          <label>Easy Descriptive</label>
                          <input
                            style={styles.inputSmall}
                            value={config.descEasy}
                            onChange={(e) =>
                              handleTopicChange(
                                topic,
                                "descEasy",
                                parseInt(e.target.value, 10) || 0
                              )
                            }
                          />
                        </div>
                        <div style={styles.formGroupInline}>
                          <label>Medium Descriptive</label>
                          <input
                            style={styles.inputSmall}
                            value={config.descMedium}
                            onChange={(e) =>
                              handleTopicChange(
                                topic,
                                "descMedium",
                                parseInt(e.target.value, 10) || 0
                              )
                            }
                          />
                        </div>
                        <div style={styles.formGroupInline}>
                          <label>Hard Descriptive</label>
                          <input
                            style={styles.inputSmall}
                            value={config.descHard}
                            onChange={(e) =>
                              handleTopicChange(
                                topic,
                                "descHard",
                                parseInt(e.target.value, 10) || 0
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={styles.actionContainer}>
          <button
            style={styles.generateButton}
            onClick={generateQuestionPaper}
            disabled={!standard || !subject || !marks || isLoading}
          >
            {isLoading ? "Generating..." : "Generate Question Paper"}
          </button>

          {responseText && (
            <div style={styles.resultContainer}>
              <h2 style={styles.resultTitle}>Generated Question Paper</h2>
              <pre style={styles.responsePre}>{responseText}</pre>
              <button style={styles.downloadButton} onClick={generatePDF}>
                Download PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerateQuestionPaper;
