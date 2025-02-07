/* eslint-disable react-hooks/rules-of-hooks */
/* TopicConfiguration.jsx */

import React, { useCallback } from "react";
import { styles } from "./styles";

/**
 * TopicConfiguration
 *
 * @param {Object} props
 * @param {string} props.subject            - The selected subject
 * @param {string} props.standard           - The selected standard/grade
 * @param {number} props.configuredMarks    - The total configured marks so far
 * @param {number} props.marks              - The total marks for the exam
 * @param {Array}  props.topics             - Array of topics available
 * @param {Object} props.topicsConfig       - Configuration for each topic
 * @param {boolean} props.hasLoadedBlueprint- Whether a blueprint has been loaded
 * @param {Function} props.setTopicsConfig
 * @param {Function} props.setConfiguredMarks
 * @param {string} props.customTopic
 * @param {Function} props.setCustomTopic
 *
 * @returns {JSX.Element | null}
 */
const TopicConfiguration = ({
  subject,
  standard,
  configuredMarks,
  marks,
  topics,
  topicsConfig,
  hasLoadedBlueprint,
  setTopicsConfig,
  setConfiguredMarks,
  customTopic,
  setCustomTopic,
}) => {
  // Helper to add a topic if it doesn't already exist in the config
  const addTopic = (topic) => {
    setTopicsConfig((prev) => {
      if (!prev[topic]) {
        return {
          ...prev,
          [topic]: {
            easyMCQs: 0,
            mediumMCQs: 0,
            hardMCQs: 0,
            mcqMarks: 1, // default MCQ marks
            descriptiveQuestionConfig: [],
          },
        };
      }
      return prev;
    });
  };

  // Handle adding topic from dropdown
  const handleAddTopicFromDropdown = (topic) => {
    if (topic && !topicsConfig[topic]) {
      addTopic(topic);
    }
  };

  // Handle adding a custom topic from input
  const handleAddCustomTopic = () => {
    const trimmed = customTopic.trim();
    if (trimmed && !topicsConfig[trimmed]) {
      addTopic(trimmed);
    }
    setCustomTopic("");
  };

  // Remove a topic entirely
  const handleRemoveTopic = (topicToRemove) => {
    let updatedMarks = configuredMarks;
    // Deduct MCQ marks
    updatedMarks -=
      (topicsConfig[topicToRemove].easyMCQs +
        topicsConfig[topicToRemove].mediumMCQs +
        topicsConfig[topicToRemove].hardMCQs) *
      topicsConfig[topicToRemove].mcqMarks;
    // Deduct descriptive marks
    topicsConfig[topicToRemove].descriptiveQuestionConfig.forEach((desc) => {
      updatedMarks -= parseInt(desc.marks) * parseInt(desc.noOfQuestions);
    });

    setConfiguredMarks(updatedMarks);

    setTopicsConfig((prev) => {
      const newConfig = { ...prev };
      delete newConfig[topicToRemove];
      return newConfig;
    });
  };

  // Update the topic config with user input
  const handleTopicChange = (topic, field, value) => {
    const prevValue = topicsConfig[topic][field] || 0;
    if (prevValue < value) {
      setConfiguredMarks(configuredMarks + (value - prevValue));
    } else {
      setConfiguredMarks(configuredMarks - (prevValue - value));
    }

    setTopicsConfig((prev) => {
      return {
        ...prev,
        [topic]: {
          ...prev[topic],
          [field]: value,
        },
      };
    });
  };

  // Remove a single descriptive question config
  const handleRemoveDescriptiveQuestion = (topic, index) => {
    const config = topicsConfig[topic].descriptiveQuestionConfig;
    const { marks, noOfQuestions } = config[index];

    // Deduct from total configured marks
    if (marks !== "" && noOfQuestions !== "") {
      const totalDeduct = parseInt(marks) * parseInt(noOfQuestions);
      setConfiguredMarks((prev) => prev - totalDeduct);
    }

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

  // If no total marks yet or no subject/standard, return null (or a placeholder).
  if (!marks || !subject || !standard) {
    return null;
  }

  // To display how many marks are configured out of the total
  const isMarksExceeded = configuredMarks > parseInt(marks);
  const marksDisplay = marks
    ? `${configuredMarks} / ${marks}`
    : configuredMarks;

  /**
   * Render the 'Select Topics' part (with useCallback to prevent unnecessary re-renders)
   */
  const renderTopicSelection = useCallback(() => {
    return (
      <div style={styles.formGroup} className="fade-in">
        <div style={styles.marksTracker}>
          <span
            style={{
              color: isMarksExceeded ? "#999" : "#000",
              fontWeight: "bold",
            }}
          >
            Configured Marks: {marksDisplay}
          </span>

          {isMarksExceeded && (
            <span
              style={{ color: "#999", fontSize: "0.9em", marginLeft: "8px" }}
            >
              (Exceeds total marks!)
            </span>
          )}
        </div>

        <label style={styles.label}>Select Topics</label>
        <div style={styles.topicSelectionContainer}>
          {/* Dropdown for existing topics */}
          <select
            style={styles.select}
            onChange={(e) => handleAddTopicFromDropdown(e.target.value)}
          >
            <option value="">Choose a Topic</option>
            {topics.map((t, idx) => (
              <option key={idx} value={t} disabled={!!topicsConfig[t]}>
                {t} {topicsConfig[t] ? "✓" : ""}
              </option>
            ))}
          </select>

          {/* Custom topic */}
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
  }, [
    topicsConfig,
    topics,
    customTopic,
    marks,
    configuredMarks,
    isMarksExceeded,
    marksDisplay,
  ]);

  return (
    <div style={styles.card} className="fade-in">
      <h2 style={styles.cardTitle}>Topic Configuration</h2>

      {/* Render the topic selection dropdown and custom topic input */}
      {topics.length > 0 && renderTopicSelection()}

      {/* Render detailed MCQ/Descriptive configs for each topic */}
      {Object.keys(topicsConfig).length > 0 && (
        <div style={styles.topicConfigDetails}>
          {Object.entries(topicsConfig).map(([topic, config]) => (
            <div key={topic} style={styles.topicConfigCard} className="fade-in">
              <div style={styles.topicConfigHeader}>
                <h3 style={styles.topicConfigTitle}>{topic}</h3>
                <button
                  style={styles.removeTopicButton}
                  className="btn-hover"
                  onClick={() => handleRemoveTopic(topic)}
                >
                  Remove
                </button>
              </div>

              {/* MCQ Inputs */}
              <div style={styles.topicConfigGrid}>
                <div style={styles.formGroupInline}>
                  <label style={styles.labelSmall}>Easy MCQs</label>
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
                  <label style={styles.labelSmall}>Medium MCQs</label>
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
                  <label style={styles.labelSmall}>Hard MCQs</label>
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
                        <div key={index} style={styles.descriptiveConfigRow}>
                          <div style={styles.descriptiveFieldGroup}>
                            <label style={styles.labelSmall}>Marks</label>
                            <input
                              style={styles.inputSmall}
                              type="number"
                              min="0"
                              value={descConfig.marks}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTopicsConfig((prev) => {
                                  const updatedArray = [
                                    ...prev[topic].descriptiveQuestionConfig,
                                  ];
                                  updatedArray[index] = {
                                    ...updatedArray[index],
                                    marks: val,
                                  };
                                  return {
                                    ...prev,
                                    [topic]: {
                                      ...prev[topic],
                                      descriptiveQuestionConfig: updatedArray,
                                    },
                                  };
                                });
                              }}
                            />
                          </div>

                          <div style={styles.descriptiveFieldGroup}>
                            <label style={styles.labelSmall}>Difficulty</label>
                            <select
                              style={styles.inputSmall}
                              value={descConfig.difficulty}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTopicsConfig((prev) => {
                                  const updatedArray = [
                                    ...prev[topic].descriptiveQuestionConfig,
                                  ];
                                  updatedArray[index] = {
                                    ...updatedArray[index],
                                    difficulty: val,
                                  };
                                  return {
                                    ...prev,
                                    [topic]: {
                                      ...prev[topic],
                                      descriptiveQuestionConfig: updatedArray,
                                    },
                                  };
                                });
                              }}
                            >
                              <option value="">Select Difficulty</option>
                              <option value="easy">Easy</option>
                              <option value="medium">Medium</option>
                              <option value="hard">Hard</option>
                            </select>
                          </div>

                          <div style={styles.descriptiveFieldGroup}>
                            <label style={styles.labelSmall}>
                              No. Of Questions
                            </label>
                            <input
                              style={styles.inputSmall}
                              value={descConfig.noOfQuestions}
                              onChange={(e) => {
                                const val = e.target.value;
                                const newNoOfQuestions =
                                  val !== "" ? parseInt(val) : 0;

                                // Recalculate configured marks
                                if (descConfig.marks) {
                                  const oldNoOfQuestions =
                                    descConfig.noOfQuestions === ""
                                      ? 0
                                      : parseInt(descConfig.noOfQuestions);
                                  const oldMarks =
                                    oldNoOfQuestions *
                                    parseInt(descConfig.marks);
                                  const newMarksForQuestion =
                                    parseInt(descConfig.marks) *
                                    newNoOfQuestions;
                                  const updatedConfiguredMarks =
                                    configuredMarks -
                                    oldMarks +
                                    newMarksForQuestion;
                                  setConfiguredMarks(updatedConfiguredMarks);
                                }

                                setTopicsConfig((prev) => {
                                  const updatedArray = [
                                    ...prev[topic].descriptiveQuestionConfig,
                                  ];
                                  updatedArray[index] = {
                                    ...updatedArray[index],
                                    noOfQuestions: val,
                                  };
                                  return {
                                    ...prev,
                                    [topic]: {
                                      ...prev[topic],
                                      descriptiveQuestionConfig: updatedArray,
                                    },
                                  };
                                });
                              }}
                            />
                          </div>

                          {/* Remove descriptive config button */}
                          <div
                            style={{
                              alignItems: "center",
                              flexDirection: "column",
                            }}
                          >
                            <button
                              style={styles.chipRemoveButton}
                              className="btn-hover"
                              onClick={() =>
                                handleRemoveDescriptiveQuestion(topic, index)
                              }
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

              {/* Button to add a new descriptive question config */}
              <div style={styles.plusIconContainer}>
                <button
                  style={styles.plusButton}
                  className="btn-hover"
                  onClick={() => {
                    setTopicsConfig((prev) => {
                      const newDescConfig = [
                        ...(prev[topic].descriptiveQuestionConfig || []),
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
  );
};

export default TopicConfiguration;
