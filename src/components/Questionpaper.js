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
  const [responseText, setResponseText] = useState("");
  const [isLoading, setIsLoading] = useState(false); // State to track loading
  const [topicsConfig, setTopicsConfig] = useState({});

  // New states for optional descriptive questions and their selected topics
  const [easyDescOptionalCount, setEasyDescOptionalCount] = useState(0);
  const [mediumDescOptionalCount, setMediumDescOptionalCount] = useState(0);
  const [hardDescOptionalCount, setHardDescOptionalCount] = useState(0);

  const [easyDescOptionalTopics, setEasyDescOptionalTopics] = useState([]);
  const [mediumDescOptionalTopics, setMediumDescOptionalTopics] = useState([]);
  const [hardDescOptionalTopics, setHardDescOptionalTopics] = useState([]);

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

                      {/* Map over descriptiveQuestionConfig to display inputs */}
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
                easyDescOptionalCount,
                mediumDescOptionalCount,
                hardDescOptionalCount,
                easyDescOptionalTopics,
                mediumDescOptionalTopics,
                hardDescOptionalTopics,
                setIsLoading,
                setResponseText,
              })
            }
            disabled={!standard || !subject}
          >
            {isLoading ? "Generating..." : "Generate Question Paper"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateQuestionPaper;
