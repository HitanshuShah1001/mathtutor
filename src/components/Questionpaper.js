/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from "react";
import { ChatHeader } from "../subcomponents/ChatHeader";
import { styles } from "../Questionpaperstyles";
import { allTopics } from "../constants/allTopics";
import { ACCESS_KEY, BASE_URL_API } from "../constants/constants";
import { putRequest } from "../utils/ApiCall";
import { Blueprintmodal, modalStyles } from "./BlueprintModal";

// NEW IMPORT
import CustomAlert from "../subcomponents/CustomAlert";
import {
  generateQuestionsArray,
  reorderQuestionsByType,
} from "../utils/generateJsonToPassToReceiveJson";

const GenerateQuestionPaper = () => {
  const [standard, setStandard] = useState("");
  const [subject, setSubject] = useState("");
  const [topics, setTopics] = useState([]);
  const [customTopic, setCustomTopic] = useState("");
  const [marks, setMarks] = useState("");
  const [title, setTitle] = useState("");
  const [academyName,setAcademyName] = useState("Knowledge High School");
  const [timeDuration,setTimeDuration] = useState("");
  const [anyotherQuery, setAnyOtherQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false); // State to track loading
  const [topicsConfig, setTopicsConfig] = useState({});
  const [configuredMarks, setConfiguredMarks] = useState(0);

  // New States for Modal and Blueprints
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [blueprints, setBlueprints] = useState([]);
  const [isLoadingBlueprints, setIsLoadingBlueprints] = useState(false);
  const [blueprintError, setBlueprintError] = useState("");
  const [cursor, setCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasLoadedBlueprint, setHasLoadedBlueprint] = useState(false);
  const [bluePrintId, setBluePrintId] = useState(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

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
    console.log(subject, standard);
    if (standard && subject) {
      const topicList = allTopics[subject][standard] || [];
      setTopics(topicList);

      // Only reset if you haven't loaded a blueprint.
      if (!hasLoadedBlueprint) {
        setTopicsConfig({});
      }
    } else {
      setTopics([]);
      if (!hasLoadedBlueprint) {
        setTopicsConfig({});
      }
    }
  }, [subject, standard, hasLoadedBlueprint]);

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
    let prevMarks = configuredMarks;
    prevMarks -=
      (topicsConfig[topicToRemove].easyMCQs +
        topicsConfig[topicToRemove].mediumMCQs +
        topicsConfig[topicToRemove].hardMCQs) *
      topicsConfig[topicToRemove].mcqMarks;
    topicsConfig[topicToRemove].descriptiveQuestionConfig.forEach((desc) => {
      prevMarks -= parseInt(desc.marks) * parseInt(desc.noOfQuestions);
    });
    setConfiguredMarks(prevMarks);
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
    let config = topicsConfig[topic].descriptiveQuestionConfig;
    let marksVal = config[index].marks;
    let noOfQuestions = config[index].noOfQuestions;
    if (marksVal !== "" && noOfQuestions !== "") {
      let newUpdatedMarks =
        configuredMarks - parseInt(marksVal) * parseInt(noOfQuestions);
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

  // Whether the user is exceeding total marks
  const isMarksExceeded = configuredMarks > parseInt(marks);

  // Convert blueprint shape
  function convertToBluePrintCompatibleFormat() {
    let blueprint = {
      name: title,
      grade: parseInt(standard),
      subject,
      totalMarks: parseInt(marks),
    };
    let breakdown = [];
    for (let key of Object.keys(topicsConfig)) {
      let obj = {};
      obj = { topic: key, ...topicsConfig[key] };
      breakdown.push(obj);
    }
    blueprint.breakdown = breakdown;
    return blueprint;
  }

  const saveBlueprint = async () => {
    let blueprint = convertToBluePrintCompatibleFormat();
    const res = await putRequest(
      `${BASE_URL_API}/blueprint/create`,
      {
        Authorization: `${localStorage.getItem(ACCESS_KEY)}`,
        "Content-Type": "application/json",
      },
      { blueprint }
    );
    if (!res.success) {
      alert(res.message ?? "Some Error Occured");
    } else {
      alert("Blueprint saved successfully");
    }
  };

  const updateBlueprint = async () => {
    let blueprint = convertToBluePrintCompatibleFormat();
    const res = await putRequest(
      `${BASE_URL_API}/blueprint/update`,
      {
        Authorization: `${localStorage.getItem(ACCESS_KEY)}`,
        "Content-Type": "application/json",
      },
      { id: bluePrintId, blueprint }
    );
    if (!res.success) {
      alert(res.message ?? "Some Error Occured");
    } else {
      alert("Blueprint updated successfully");
    }
  };

  // UseCallback for RenderTopicSelection
  const RenderTopicSelection = useCallback(() => {
    let renderContent = marks
      ? `${configuredMarks} / ${marks}`
      : configuredMarks;
    return (
      <div style={styles.formGroup} className="fade-in">
        <div style={styles.marksTracker}>
          <span
            style={{
              color: configuredMarks > parseInt(marks) ? "#999" : "#000",
              fontWeight: "bold",
            }}
          >
            Configured Marks: {renderContent}
          </span>

          {configuredMarks > parseInt(marks) && (
            <span
              style={{ color: "#999", fontSize: "0.9em", marginLeft: "8px" }}
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
  }, [topicsConfig, topics, customTopic, marks, configuredMarks]);

  // NEW: Function to fetch blueprints
  const fetchBlueprints = async () => {
    setIsLoadingBlueprints(true);
    setBlueprintError("");

    try {
      const url = new URL(`${BASE_URL_API}/blueprint/getPaginatedBlueprints`);
      url.searchParams.append("limit", 100);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `${localStorage.getItem(ACCESS_KEY)}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      console.log(data, "data");
      if (data.success) {
        setBlueprints(data.blueprints);
        setHasNextPage(data.hasNextPage);
        setCursor(data.nextCursor);
      } else {
        setBlueprintError(data.message || "Failed to fetch blueprints.");
      }
    } catch (error) {
      console.error("Error fetching blueprints:", error);
      setBlueprintError("An error occurred while fetching blueprints.");
    } finally {
      setIsLoadingBlueprints(false);
    }
  };

  // NEW: Handler to open modal and fetch blueprints
  const handleOpenModal = () => {
    setIsModalOpen(true);
    fetchBlueprints();
  };

  // NEW: Handler to load a blueprint into the form
  const handleLoadBlueprint = (blueprint) => {
    setBluePrintId(blueprint.id);
    setHasLoadedBlueprint(true);
    setTitle(blueprint.name);
    setStandard(blueprint.grade.toString());
    setSubject(blueprint.subject);
    setMarks(blueprint.totalMarks.toString());

    // Reset topicsConfig
    const newTopicsConfig = {};
    blueprint.breakdown.forEach((topic) => {
      newTopicsConfig[topic.topic] = {
        easyMCQs: topic.easyMCQs,
        mediumMCQs: topic.mediumMCQs,
        hardMCQs: topic.hardMCQs,
        mcqMarks: topic.mcqMarks,
        descriptiveQuestionConfig: topic.descriptiveQuestionConfig.map(
          (desc) => ({
            marks: desc.marks.toString(),
            difficulty: desc.difficulty,
            noOfQuestions: desc.noOfQuestions.toString(),
          })
        ),
      };
    });
    setTopicsConfig(newTopicsConfig);
    setConfiguredMarks(0);

    // Calculate configuredMarks
    let totalConfiguredMarks = 0;
    blueprint.breakdown.forEach((topic) => {
      totalConfiguredMarks +=
        (topic.easyMCQs + topic.mediumMCQs + topic.hardMCQs) * topic.mcqMarks;
      topic.descriptiveQuestionConfig.forEach((desc) => {
        totalConfiguredMarks += desc.marks * desc.noOfQuestions;
      });
    });
    setConfiguredMarks(totalConfiguredMarks);

    // Close modal
    setIsModalOpen(false);
  };

  const handleGenerateQuestionPaper = async () => {
    const blueprint = reorderQuestionsByType(
      generateQuestionsArray(topicsConfig)
    );
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", localStorage.getItem(ACCESS_KEY));
    const body = JSON.stringify({
      subject,
      grade: parseInt(standard),
      name: title,
      blueprint,
      totalMarks: marks,
      lengthOfBlueprint: blueprint.length,
      academyName,
      timeDuration
    });
    try {
      const url = new URL(`${BASE_URL_API}/questionPaper/generate`);
      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body,
      };
      const response = await fetch(url.toString(), requestOptions);
      const data = await response.json();
    } catch (e) {
    } finally {
      setIsAlertModalOpen(true);
    }
  };
  return (
    <div style={styles.pageContainer} className="fade-in">
      {/* NEW: Load Blueprint Button */}
      <CustomAlert
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        message={
          "Thank you for initiating the question paper generation. You will be notified as soon as the process is complete."
        }
      />
      <div style={{ marginBottom: "20px", textAlign: "right" }}>
        <button
          style={styles.loadButton}
          className="btn-hover"
          onClick={handleOpenModal}
        >
          Load from existing blueprint
        </button>
      </div>

      <ChatHeader title={"Generate Question Paper"} />

      {/* Modal for Blueprints */}
      <Blueprintmodal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <h2 style={{ marginBottom: "20px" }}>Select a Blueprint</h2>
        {isLoadingBlueprints ? (
          <p style={{ color: "#000" }}>Loading blueprints...</p>
        ) : blueprintError ? (
          <p style={{ color: "#666" }}>{blueprintError}</p>
        ) : blueprints.length === 0 ? (
          <p style={{ color: "#666" }}>No blueprints found.</p>
        ) : (
          <div>
            {blueprints.map((bp) => (
              <div
                key={`${bp.id}${bp?.createdAt}/${bp.updatedAt}`}
                style={modalStyles.blueprintItem}
                className="fade-in"
              >
                <div style={modalStyles.blueprintHeader}>
                  <div>
                    <h3 style={{ color: "#000", marginBottom: "5px" }}>
                      {bp.name}
                    </h3>
                    <p style={{ color: "#000", margin: "0" }}>
                      Grade: {bp.grade} | Subject: {bp.subject} | Total Marks:{" "}
                      {bp.totalMarks}
                    </p>
                    <p style={{ color: "#555", margin: "5px 0" }}>
                      Created At:{" "}
                      {new Date(bp?.createdAt).toLocaleDateString("en-GB")}
                    </p>
                    {bp.createdAt !== bp.updatedAt && (
                      <p style={{ color: "#555", margin: "0" }}>
                        Last Updated:{" "}
                        {new Date(bp?.updatedAt).toLocaleDateString("en-GB")}
                      </p>
                    )}
                  </div>
                  <button
                    style={modalStyles.loadButton}
                    className="btn-hover"
                    onClick={() => handleLoadBlueprint(bp)}
                  >
                    Load
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Blueprintmodal>

      <div style={styles.container}>
        <div style={styles.formContainer}>
          <div style={styles.columnLeft}>
            <div style={styles.card} className="fade-in">
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
                <label style={styles.label}>Academy Name</label>
                <input
                  style={styles.input}
                  value={academyName}
                  onChange={(e) => setAcademyName(e.target.value)}
                  placeholder="12 Std. Question Paper"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Standard</label>
                <select
                  style={styles.select}
                  value={standard}
                  onChange={(e) => {
                    setHasLoadedBlueprint(false);
                    setStandard(e.target.value);
                  }}
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
                  onChange={(e) => {
                    setHasLoadedBlueprint(false);
                    setSubject(e.target.value);
                  }}
                >
                  <option value="">Select Subject</option>
                  <option value="Science">Science</option>
                  <option value="Maths">Maths</option>
                  {/* Add more subjects as needed */}
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
                <label style={styles.label}>Time Duration</label>
                <input
                  style={styles.input}
                  value={timeDuration}
                  onChange={(e) => setTimeDuration(e.target.value)}
                  placeholder="2 Hours"
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
              <div style={styles.card} className="fade-in">
                <h2 style={styles.cardTitle}>Topic Configuration</h2>

                {topics.length > 0 && <RenderTopicSelection />}

                {Object.keys(topicsConfig).length > 0 && (
                  <div style={styles.topicConfigDetails}>
                    {Object.entries(topicsConfig).map(([topic, config]) => (
                      <div
                        key={topic}
                        style={styles.topicConfigCard}
                        className="fade-in"
                      >
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
                                  <div
                                    key={index}
                                    style={styles.descriptiveConfigRow}
                                  >
                                    <div style={styles.descriptiveFieldGroup}>
                                      <label style={styles.labelSmall}>
                                        Marks
                                      </label>
                                      <input
                                        style={styles.inputSmall}
                                        type="number"
                                        min="0"
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
                                      <label style={styles.labelSmall}>
                                        Difficulty
                                      </label>
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
                                          if (descConfig?.marks) {
                                            let oldQuestionTotal =
                                              descConfig?.noOfQuestions === ""
                                                ? 0
                                                : parseInt(
                                                    descConfig?.noOfQuestions
                                                  );
                                            let oldMarks =
                                              parseInt(oldQuestionTotal) *
                                              parseInt(descConfig.marks);
                                            let newMarksForQuestion =
                                              parseInt(descConfig.marks) *
                                              newNoOfQuestions;
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
                                        className="btn-hover"
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
                                  </div>
                                )
                              )}
                            </div>
                          )}

                        <div style={styles.plusIconContainer}>
                          <button
                            style={styles.plusButton}
                            className="btn-hover"
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
          {/* Generate Question Paper => Now calls handleGenerateQuestionPaper */}
          <button
            style={styles.generateButton}
            className="btn-hover"
            onClick={handleGenerateQuestionPaper}
            disabled={
              !standard ||
              !subject ||
              isLoading ||
              isMarksExceeded ||
              !title ||
              !marks ||
              configuredMarks !== parseInt(marks)
            }
          >
            {isMarksExceeded
              ? "Total marks exceeded"
              : isLoading
              ? "Generating..."
              : "Generate Question Paper"}
          </button>

          <button
            style={styles.blueprintButton}
            className="btn-hover"
            onClick={hasLoadedBlueprint ? updateBlueprint : saveBlueprint}
            disabled={
              !standard ||
              !subject ||
              isLoading ||
              isMarksExceeded ||
              !title ||
              !marks ||
              configuredMarks !== parseInt(marks)
            }
          >
            {hasLoadedBlueprint ? "Update Blueprint" : "Save BluePrint"}
          </button>
        </div>

        {/* If a jobId was created, show it to the user (optional). */}
      </div>
    </div>
  );
};

export default GenerateQuestionPaper;
