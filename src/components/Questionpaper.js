import React, { useState, useEffect, useCallback } from "react";
import { openai } from "./InitOpenAI";
import { jsPDF } from "jspdf"; // Import jsPDF
import { ChatHeader } from "./ChatHeader";
import { styles } from "../Questionpaperstyles";
import { generatePrompt } from "../utils/GeneratePrompt";

const GenerateQuestionPaper = () => {
  const [standard, setStandard] = useState("");
  const [subject, setSubject] = useState("");
  const [topics, setTopics] = useState([]);
  const [customTopic, setCustomTopic] = useState("");
  const [marks, setMarks] = useState("");
  const [title, setTitle] = useState("");
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

  // New states for optional descriptive questions and their selected topics
  const [easyDescOptionalCount, setEasyDescOptionalCount] = useState(0);
  const [mediumDescOptionalCount, setMediumDescOptionalCount] = useState(0);
  const [hardDescOptionalCount, setHardDescOptionalCount] = useState(0);

  const [easyDescOptionalTopics, setEasyDescOptionalTopics] = useState([]);
  const [mediumDescOptionalTopics, setMediumDescOptionalTopics] = useState([]);
  const [hardDescOptionalTopics, setHardDescOptionalTopics] = useState([]);

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
      setTopicsConfig({});
      setEasyDescOptionalTopics([]);
      setMediumDescOptionalTopics([]);
      setHardDescOptionalTopics([]);
    } else {
      setTopics([]);
      setTopicsConfig({});
      setEasyDescOptionalTopics([]);
      setMediumDescOptionalTopics([]);
      setHardDescOptionalTopics([]);
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

  // Handlers for adding/removing optional descriptive topics
  const handleAddEasyDescOptionalTopic = (topic) => {
    if (
      topic &&
      !easyDescOptionalTopics.includes(topic) &&
      easyDescOptionalTopics.length < easyDescOptionalCount
    ) {
      setEasyDescOptionalTopics((prev) => [...prev, topic]);
    }
  };

  const handleRemoveEasyDescOptionalTopic = (t) => {
    setEasyDescOptionalTopics((prev) => prev.filter((x) => x !== t));
  };

  const handleAddMediumDescOptionalTopic = (topic) => {
    if (
      topic &&
      !mediumDescOptionalTopics.includes(topic) &&
      mediumDescOptionalTopics.length < mediumDescOptionalCount
    ) {
      setMediumDescOptionalTopics((prev) => [...prev, topic]);
    }
  };

  const handleRemoveMediumDescOptionalTopic = (t) => {
    setMediumDescOptionalTopics((prev) => prev.filter((x) => x !== t));
  };

  const handleAddHardDescOptionalTopic = (topic) => {
    if (
      topic &&
      !hardDescOptionalTopics.includes(topic) &&
      hardDescOptionalTopics.length < hardDescOptionalCount
    ) {
      setHardDescOptionalTopics((prev) => [...prev, topic]);
    }
  };

  const handleRemoveHardDescOptionalTopic = (t) => {
    setHardDescOptionalTopics((prev) => prev.filter((x) => x !== t));
  };

  const generateQuestionPaper = async () => {
    try {
      setIsLoading(true);
      const prompt = generatePrompt({
        title,
        topicsConfig,
        standard,
        subject,
        marks,
        mcqs,
        anyotherQuery,
        easyMCQMarks,
        mediumMCQMarks,
        hardMCQMarks,
        easyDescMarks,
        mediumDescMarks,
        hardDescMarks,
        easyDescOptionalCount,
        mediumDescOptionalCount,
        hardDescOptionalCount,
        easyDescOptionalTopics,
        mediumDescOptionalTopics,
        hardDescOptionalTopics,
      });
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
  
    // Calculate page dimensions and line height
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const leftMargin = 50;
    const topMargin = 50;
    const lineHeight = 14; // Adjust as needed for line spacing
  
    // Split text into lines based on page width to avoid horizontal overflow
    const lines = doc.splitTextToSize(responseText, pageWidth - leftMargin * 2);
  
    let currentY = topMargin;
  
    // Render each line, adding pages as needed
    for (let i = 0; i < lines.length; i++) {
      if (currentY > pageHeight - topMargin) {
        // If we're beyond the printable area, add a new page
        doc.addPage();
        currentY = topMargin;
      }
  
      doc.text(leftMargin, currentY, lines[i]);
      currentY += lineHeight;
    }
  
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
              
              style={styles.inputInline}
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Or add custom topic"
            />
            {/* <input
                  style={styles.input}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="12 Std. Question Paper"
                /> */}
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
                <label style={styles.label}>Title</label>
                <input
                  style={styles.input}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="12 Std. Question Paper"
                />
              </div>
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

              {/* New fields for optional descriptive questions */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  No. of Easy Descriptive Optional Questions
                </label>
                <input
                  style={styles.input}
                  value={easyDescOptionalCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 0;
                    setEasyDescOptionalCount(val);
                    if (val === 0) setEasyDescOptionalTopics([]);
                    else if (easyDescOptionalTopics.length > val) {
                      setEasyDescOptionalTopics(
                        easyDescOptionalTopics.slice(0, val)
                      );
                    }
                  }}
                />
                {easyDescOptionalCount > 0 && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      Select {easyDescOptionalCount} Easy Descriptive Topics
                    </label>
                    <select
                      style={styles.select}
                      onChange={(e) => {
                        if (e.target.value)
                          handleAddEasyDescOptionalTopic(e.target.value);
                      }}
                    >
                      <option value="">Choose a Topic</option>
                      {topics.map((t, idx) => (
                        <option
                          key={idx}
                          value={t}
                          disabled={
                            easyDescOptionalTopics.includes(t) ||
                            easyDescOptionalTopics.length >=
                              easyDescOptionalCount
                          }
                        >
                          {t} {easyDescOptionalTopics.includes(t) ? "✓" : ""}
                        </option>
                      ))}
                    </select>
                    {easyDescOptionalTopics.length > 0 && (
                      <div style={styles.selectedTopicsChips}>
                        {easyDescOptionalTopics.map((t) => (
                          <div key={t} style={styles.topicChip}>
                            {t}
                            <button
                              style={styles.chipRemoveButton}
                              onClick={() =>
                                handleRemoveEasyDescOptionalTopic(t)
                              }
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  No. of Medium Descriptive Optional Questions
                </label>
                <input
                  style={styles.input}
                  value={mediumDescOptionalCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 0;
                    setMediumDescOptionalCount(val);
                    if (val === 0) setMediumDescOptionalTopics([]);
                    else if (mediumDescOptionalTopics.length > val) {
                      setMediumDescOptionalTopics(
                        mediumDescOptionalTopics.slice(0, val)
                      );
                    }
                  }}
                />
                {mediumDescOptionalCount > 0 && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      Select {mediumDescOptionalCount} Medium Descriptive Topics
                    </label>
                    <select
                      style={styles.select}
                      onChange={(e) => {
                        if (e.target.value)
                          handleAddMediumDescOptionalTopic(e.target.value);
                      }}
                    >
                      <option value="">Choose a Topic</option>
                      {topics.map((t, idx) => (
                        <option
                          key={idx}
                          value={t}
                          disabled={
                            mediumDescOptionalTopics.includes(t) ||
                            mediumDescOptionalTopics.length >=
                              mediumDescOptionalCount
                          }
                        >
                          {t} {mediumDescOptionalTopics.includes(t) ? "✓" : ""}
                        </option>
                      ))}
                    </select>
                    {mediumDescOptionalTopics.length > 0 && (
                      <div style={styles.selectedTopicsChips}>
                        {mediumDescOptionalTopics.map((t) => (
                          <div key={t} style={styles.topicChip}>
                            {t}
                            <button
                              style={styles.chipRemoveButton}
                              onClick={() =>
                                handleRemoveMediumDescOptionalTopic(t)
                              }
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  No. of Hard Descriptive Optional Questions
                </label>
                <input
                  style={styles.input}
                  value={hardDescOptionalCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 0;
                    setHardDescOptionalCount(val);
                    if (val === 0) setHardDescOptionalTopics([]);
                    else if (hardDescOptionalTopics.length > val) {
                      setHardDescOptionalTopics(
                        hardDescOptionalTopics.slice(0, val)
                      );
                    }
                  }}
                />
                {hardDescOptionalCount > 0 && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      Select {hardDescOptionalCount} Hard Descriptive Topics
                    </label>
                    <select
                      style={styles.select}
                      onChange={(e) => {
                        if (e.target.value)
                          handleAddHardDescOptionalTopic(e.target.value);
                      }}
                    >
                      <option value="">Choose a Topic</option>
                      {topics.map((t, idx) => (
                        <option
                          key={idx}
                          value={t}
                          disabled={
                            hardDescOptionalTopics.includes(t) ||
                            hardDescOptionalTopics.length >=
                              hardDescOptionalCount
                          }
                        >
                          {t} {hardDescOptionalTopics.includes(t) ? "✓" : ""}
                        </option>
                      ))}
                    </select>
                    {hardDescOptionalTopics.length > 0 && (
                      <div style={styles.selectedTopicsChips}>
                        {hardDescOptionalTopics.map((t) => (
                          <div key={t} style={styles.topicChip}>
                            {t}
                            <button
                              style={styles.chipRemoveButton}
                              onClick={() =>
                                handleRemoveHardDescOptionalTopic(t)
                              }
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
