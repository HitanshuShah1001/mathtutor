/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from "react";
import { ChatHeader } from "../subcomponents/ChatHeader";
import { styles } from "../Questionpaperstyles";
import { allTopics } from "../constants/allTopics";
import { generateQuestionPaper } from "../utils/generateQuestionPaper";

const GenerateQuestionPaper = () => {
  const [standard, setStandard] = useState("");
  const [subject, setSubject] = useState("");
  const [topics, setTopics] = useState([]);
  const [customTopic, setCustomTopic] = useState("");
  const [marks, setMarks] = useState("");
  const [title, setTitle] = useState("");
  const [mcqs, setMcqs] = useState("");
  const [anyotherQuery, setAnyOtherQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false); // State to track loading
  const [topicsConfig, setTopicsConfig] = useState({});
  const [configuredMarks, setConfiguredMarks] = useState(0);

  const [easyDescOptionalTopics, setEasyDescOptionalTopics] = useState([]);
  const [mediumDescOptionalTopics, setMediumDescOptionalTopics] = useState([]);
  const [hardDescOptionalTopics, setHardDescOptionalTopics] = useState([]);

  const calculateTotalMarks = useCallback(() => {
    let total = 0;

    // Calculate marks from all topics
    Object.values(topicsConfig).forEach((config) => {
      // MCQ marks (1 mark each)
      total +=
        (config.easyMCQs || 0) +
        (config.mediumMCQs || 0) +
        (config.hardMCQs || 0);

      // Descriptive question marks
      if (config.descriptiveQuestionConfig) {
        config.descriptiveQuestionConfig.forEach((descConfig) => {
          total +=
            (parseInt(descConfig.marks) || 0) *
            (parseInt(descConfig.noOfQuestions) || 0);
        });
      }
    });

    setConfiguredMarks(total);
  }, [topicsConfig]);

  // Initialize state from localStorage
  useEffect(() => {
    const savedStandard = localStorage.getItem("standard");
    const savedSubject = localStorage.getItem("subject");
    const savedTopicsConfig = localStorage.getItem("topicsConfig");
    const savedMCQs = localStorage.getItem("mcqs");

    if (savedStandard) setStandard(savedStandard);
    if (savedSubject) setSubject(savedSubject);
    if (savedTopicsConfig) setTopicsConfig(JSON.parse(savedTopicsConfig));
    if (savedMCQs) setMcqs(savedMCQs);
  }, []);

  // Watchers to save state to localStorage
  useEffect(() => {
    localStorage.setItem("standard", standard);
  }, [standard]);

  useEffect(() => {
    localStorage.setItem("subject", subject);
  }, [subject]);

  useEffect(() => {
    localStorage.setItem("topicsConfig", JSON.stringify(topicsConfig));
  }, [topicsConfig]);

  useEffect(() => {
    localStorage.setItem("mcqs", mcqs);
  }, [mcqs]);

  useEffect(() => {
    calculateTotalMarks();
  }, [topicsConfig, calculateTotalMarks]);

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
            descriptiveQuestionConfig: [],
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

  // NEW: Handler to remove a single descriptive config entry
  const handleRemoveDescriptiveQuestion = (topic, index) => {
    setTopicsConfig((prev) => {
      const updatedArray = [...prev[topic].descriptiveQuestionConfig];
      updatedArray.splice(index, 1);
      return {
        ...prev,
        [topic]: {
          ...prev[topic],
          descriptiveQuestionConfig: updatedArray,
        },
      };
    });
  };

  // Update the generate button to be disabled if marks exceed total
  const isMarksExceeded = configuredMarks > parseInt(marks);

  const RenderTopicSelection = useCallback(() => {
    return (
      <div style={styles.formGroup}>
        <div style={styles.marksTracker}>
          {marks !== "" && (
            <span
              style={{
                color: configuredMarks > parseInt(marks) ? "red" : "green",
                fontWeight: "bold",
              }}
            >
              Configured Marks: {configuredMarks} / {marks || "?"}
            </span>
          )}

          {configuredMarks > parseInt(marks) && (
            <span
              style={{ color: "red", fontSize: "0.9em", marginLeft: "8px" }}
            >
              (Exceeds total marks!)
            </span>
          )}
        </div>
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
                {" "}
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

                      {/* MCQ Inputs */}
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
                      </div>

                      {/* Descriptive Question Configs */}
                      {config.descriptiveQuestionConfig &&
                        config.descriptiveQuestionConfig.length > 0 && (
                          <div style={styles.descriptiveConfigContainer}>
                            <h4 style={styles.descriptiveConfigTitle}>
                              Descriptive Questions
                            </h4>
                            {config.descriptiveQuestionConfig.map(
                              (descConfig, index) => (
                                <div
                                  key={index}
                                  style={styles.descriptiveConfigRow}
                                >
                                  <div style={styles.descriptiveFieldGroup}>
                                    <label>Marks</label>
                                    <input
                                      style={styles.inputSmall}
                                      value={descConfig.marks}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setTopicsConfig((prev) => {
                                          const updatedArray = [
                                            ...prev[topic]
                                              .descriptiveQuestionConfig,
                                          ];
                                          updatedArray[index] = {
                                            ...updatedArray[index],
                                            marks: val,
                                          };
                                          return {
                                            ...prev,
                                            [topic]: {
                                              ...prev[topic],
                                              descriptiveQuestionConfig:
                                                updatedArray,
                                            },
                                          };
                                        });
                                      }}
                                    />
                                  </div>

                                  <div style={styles.descriptiveFieldGroup}>
                                    <label>Difficulty</label>
                                    <select
                                      style={styles.inputSmall}
                                      value={descConfig.difficulty}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setTopicsConfig((prev) => {
                                          const updatedArray = [
                                            ...prev[topic]
                                              .descriptiveQuestionConfig,
                                          ];
                                          updatedArray[index] = {
                                            ...updatedArray[index],
                                            difficulty: val,
                                          };
                                          return {
                                            ...prev,
                                            [topic]: {
                                              ...prev[topic],
                                              descriptiveQuestionConfig:
                                                updatedArray,
                                            },
                                          };
                                        });
                                      }}
                                    >
                                      <option value="">
                                        Select Difficulty
                                      </option>
                                      <option value="easy">Easy</option>
                                      <option value="medium">Medium</option>
                                      <option value="hard">Hard</option>
                                    </select>
                                  </div>

                                  <div style={styles.descriptiveFieldGroup}>
                                    <label>No. Of Questions</label>
                                    <input
                                      style={styles.inputSmall}
                                      value={descConfig.noOfQuestions}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setTopicsConfig((prev) => {
                                          const updatedArray = [
                                            ...prev[topic]
                                              .descriptiveQuestionConfig,
                                          ];
                                          updatedArray[index] = {
                                            ...updatedArray[index],
                                            noOfQuestions: val,
                                          };
                                          return {
                                            ...prev,
                                            [topic]: {
                                              ...prev[topic],
                                              descriptiveQuestionConfig:
                                                updatedArray,
                                            },
                                          };
                                        });
                                      }}
                                    />
                                  </div>
                                  <div
                                    style={{
                                      alignItems: "center",
                                      flexDirection: "column",
                                    }}
                                  >
                                    <button
                                      style={styles.chipRemoveButton}
                                      onClick={() =>
                                        handleRemoveDescriptiveQuestion(
                                          topic,
                                          index
                                        )
                                      }
                                    >
                                      ×
                                    </button>
                                  </div>
                                  {/* NEW: Remove button for each descriptive config */}
                                </div>
                              )
                            )}
                          </div>
                        )}

                      <div style={styles.plusIconContainer}>
                        <button
                          style={styles.plusButton}
                          onClick={() => {
                            setTopicsConfig((prev) => {
                              const newDescConfig = [
                                ...(prev[topic].descriptiveQuestionConfig ||
                                  []),
                                {
                                  marks: "",
                                  difficulty: "",
                                  noOfQuestions: "",
                                },
                              ];
                              return {
                                ...prev,
                                [topic]: {
                                  ...prev[topic],
                                  descriptiveQuestionConfig: newDescConfig,
                                },
                              };
                            });
                          }}
                        >
                          +
                        </button>
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
            onClick={() =>
              generateQuestionPaper({
                topicsConfig,
                standard,
                subject,
                marks,
                mcqs,
                anyotherQuery,
                easyDescOptionalTopics,
                mediumDescOptionalTopics,
                hardDescOptionalTopics,
                setIsLoading,
              })
            }
            disabled={!standard || !subject}
          >
            {isMarksExceeded
              ? "Total marks exceeded"
              : isLoading
              ? "Generating..."
              : "Generate Question Paper"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateQuestionPaper;
