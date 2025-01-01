/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from "react";
import { ChatHeader } from "../subcomponents/ChatHeader";
import { styles } from "../Questionpaperstyles";
import { allTopics } from "../constants/allTopics";
import { generateQuestionPaper } from "../utils/generateQuestionPaper";
import { Download } from "lucide-react";

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
  const [responseText, setResponseText] = useState(null);

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
    setConfiguredMarks(0);
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
    let prevConfig = topicsConfig[topic][field] ?? 0;
    if (prevConfig < value) {
      const DIFFERENCEINMARKS = value - prevConfig;
      let newConfiguredMarks = configuredMarks + DIFFERENCEINMARKS;
      setConfiguredMarks(newConfiguredMarks);
    } else {
      const DIFFERENCEINMARKS = prevConfig - value;
      let newConfiguredMarks = configuredMarks - DIFFERENCEINMARKS;
      setConfiguredMarks(newConfiguredMarks);
    }
    setTopicsConfig((prev) => {
      const updated = { ...prev[topic], [field]: value };
      return { ...prev, [topic]: updated };
    });
  };

  // NEW: Handler to remove a single descriptive config entry
  const handleRemoveDescriptiveQuestion = (topic, index) => {
    console.log(topicsConfig[topic].descriptiveQuestionConfig, "topic");
    let config = topicsConfig[topic].descriptiveQuestionConfig;
    let marks = config[index].marks;
    let noOfQuestions = config[index].noOfQuestions;
    if (marks !== "" && noOfQuestions !== "") {
      let newUpdatedMarks =
        configuredMarks - parseInt(marks) * parseInt(noOfQuestions);
      setConfiguredMarks(newUpdatedMarks);
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

  // Update the generate button to be disabled if marks exceed total
  const isMarksExceeded = configuredMarks > parseInt(marks);

  const generatePDF = (content, filename) => {
    const element = document.createElement("div");
    element.innerHTML = content;

    const style = document.createElement("style");
    style.textContent = `
      body { font-family: Arial, sans-serif; }
      @page { margin: 1cm; }
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.head.appendChild(style);
    printWindow.document.body.appendChild(element);

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const RenderTopicSelection = useCallback(() => {
    let renderContent = marks
      ? `${configuredMarks} / ${marks}`
      : configuredMarks;
    return (
      <div style={styles.formGroup}>
        <div style={styles.marksTracker}>
          <span
            style={{
              color: configuredMarks > parseInt(marks) ? "red" : "green",
              fontWeight: "bold",
            }}
          >
            Configured Marks: {renderContent}
          </span>

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
  }, [topicsConfig, topics, customTopic, marks]); // Dependencies

  if (responseText) {
    return (
      <div className="w-full space-y-6 mt-8">
        {/* Question Paper */}
        <div className="w-full">
          <div>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{
                __html: responseText.QuestionPaper,
              }}
            />
          </div>
        </div>

        {/* Answer Sheet */}
        <div className="w-full">
          <div>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: responseText.AnswerSheet }}
            />
          </div>
        </div>

        {/* Print Buttons */}
        <div className="flex gap-4 justify-end">
          <button
            onClick={() => {
              const printWindow = window.open("", "_blank");
              printWindow.document.write(responseText.QuestionPaper);
              printWindow.document.close();
              printWindow.print();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Print Question Paper
          </button>
          <button
            onClick={() => {
              const printWindow = window.open("", "_blank");
              printWindow.document.write(responseText.AnswerSheet);
              printWindow.document.close();
              printWindow.print();
            }}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Print Answer Sheet
          </button>
          <button
            onClick={() =>
              generatePDF(responseText.AnswerSheet, "answer_sheet.pdf")
            }
            className="flex items-center gap-1 px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
            title="Save as PDF"
          >
            <Download size={16} /> PDF
          </button>
          <button
            onClick={() =>
              generatePDF(responseText.QuestionPaper, "question_paper.pdf")
            }
            className="flex items-center gap-1 px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
            title="Save as PDF"
          >
            <Download size={16} /> PDF
          </button>
        </div>
      </div>
    );
  } else {
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
            {marks && (
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
                                            const newNoOfQuestions =
                                              val !== "" ? parseInt(val) : 0;
                                            if (descConfig?.marks) {
                                              let oldQuestionTotal =
                                                descConfig?.noOfQuestions === ""
                                                  ? 0
                                                  : parseInt(
                                                      descConfig?.noOfQuestions
                                                    );
                                              console.log(oldQuestionTotal);
                                              let oldMarks =
                                                parseInt(oldQuestionTotal) *
                                                parseInt(descConfig.marks);
                                              let newMarksForQuestion =
                                                parseInt(descConfig.marks) *
                                                newNoOfQuestions;
                                              console.log();
                                              let newMarks =
                                                configuredMarks -
                                                oldMarks +
                                                newMarksForQuestion;
                                              setConfiguredMarks(newMarks);
                                            }
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
            )}
          </div>

          <div style={styles.actionContainer}>
            <button
              style={styles.generateButton}
              onClick={() =>
                generateQuestionPaper({
                  topicsConfig,
                  setIsLoading,
                  setResponseText,
                })
              }
              disabled={!standard || !subject || isLoading || isMarksExceeded}
            >
              {isMarksExceeded
                ? "Total marks exceeded"
                : isLoading
                ? "Generating..."
                : "Generate Question Paper"}
            </button>
            <button
              style={styles.blueprintButton}
              onClick={() =>
                generateQuestionPaper({
                  topicsConfig,
                  setIsLoading,
                  setResponseText,
                })
              }
              disabled={!standard || !subject || isLoading || isMarksExceeded}
            >
            Save BluePrint
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default GenerateQuestionPaper;
