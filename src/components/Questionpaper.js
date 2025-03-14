/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from "react";
import { ChatHeader } from "../subcomponents/ChatHeader";
import { allTopics } from "../constants/allTopics";
import { ACCESS_KEY, BASE_URL_API } from "../constants/constants";
import {
  getRequest,
  postRequestWithoutStringified,
  putRequest,
} from "../utils/ApiCall";
import { Blueprintmodal } from "./BlueprintModal";
import CustomAlert from "../subcomponents/CustomAlert";
import {
  generateQuestionsArray,
  reorderQuestionsByType,
} from "../utils/generateJsonToPassToReceiveJson";

// Extracted Tailwind CSS class constants for consistency
const containerClass = "p-4 fade-in";
const cardClass = "bg-white rounded-lg shadow p-4 fade-in";
const cardTitleClass = "text-2xl font-semibold mb-4 text-gray-800";
const formGroupClass = "mb-2";
const labelClass = "block text-gray-800 font-medium mb-1";
const inputClass =
  "w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500";
const selectClass =
  "w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500";
const actionButtonClass =
  "px-4 py-2 bg-[#000] text-white font-semibold rounded hover:bg-[#000] transition-colors";
const chipClass =
  "inline-flex items-center bg-gray-200 text-gray-800 px-3 py-1 mr-2 mb-2";
const chipRemoveButtonClass = "ml-2 text-red-600 font-bold";
const gridThreeClass = "grid grid-cols-1 md:grid-cols-3 gap-4";
const blueprintItemClass =
  "p-4 border border-gray-200 rounded-lg shadow-sm mb-4 fade-in";
const blueprintHeaderClass = "flex justify-between items-center";

const GenerateQuestionPaper = () => {
  const [standard, setStandard] = useState("");
  const [subject, setSubject] = useState("");
  const [topics, setTopics] = useState([]);
  const [customTopic, setCustomTopic] = useState("");
  const [marks, setMarks] = useState("");
  const [numberOfSets, setNumberOfSets] = useState(1);
  const [title, setTitle] = useState("");
  const [academyName, setAcademyName] = useState("Knowledge High School");
  const [timeDuration, setTimeDuration] = useState("");
  const [anyotherQuery, setAnyOtherQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [topicsConfig, setTopicsConfig] = useState({});
  const [configuredMarks, setConfiguredMarks] = useState(0);

  // Blueprint modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [blueprints, setBlueprints] = useState([]);
  const [isLoadingBlueprints, setIsLoadingBlueprints] = useState(false);
  const [blueprintError, setBlueprintError] = useState("");
  const [cursor, setCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasLoadedBlueprint, setHasLoadedBlueprint] = useState(false);
  const [bluePrintId, setBluePrintId] = useState(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  // Calculate total configured marks whenever topicsConfig changes
  useEffect(() => {
    calculateTotalConfiguredMarks();
  }, [topicsConfig]);

  useEffect(() => {
    if (standard && subject) {
      const topicList = allTopics[subject][standard] || [];
      setTopics(topicList);
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

  // Function to calculate total configured marks
  const calculateTotalConfiguredMarks = () => {
    let totalMarks = 0;

    Object.values(topicsConfig).forEach((config) => {
      // Add MCQ marks
      const mcqCount =
        (config.easyMCQs || 0) +
        (config.mediumMCQs || 0) +
        (config.hardMCQs || 0);
      totalMarks += mcqCount * (config.mcqMarks || 1);

      // Add descriptive question marks
      if (config.descriptiveQuestionConfig) {
        config.descriptiveQuestionConfig.forEach((desc) => {
          const questionMarks = parseInt(desc.marks) || 0;
          const questionCount = parseInt(desc.noOfQuestions) || 0;
          totalMarks += questionMarks * questionCount;
        });
      }
    });

    setConfiguredMarks(totalMarks);
    return totalMarks;
  };

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
    const trimmed = customTopic.trim();
    if (trimmed && !topicsConfig[trimmed]) {
      addTopic(trimmed);
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

  const handleDescriptiveQuestionChange = (topic, index, field, value) => {
    setTopicsConfig((prev) => {
      const updatedArray = [...prev[topic].descriptiveQuestionConfig];
      updatedArray[index] = {
        ...updatedArray[index],
        [field]: value,
      };
      return {
        ...prev,
        [topic]: {
          ...prev[topic],
          descriptiveQuestionConfig: updatedArray,
        },
      };
    });
  };

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

  const isMarksExceeded = configuredMarks > parseInt(marks);

  function convertToBluePrintCompatibleFormat() {
    let blueprint = {
      name: title,
      grade: parseInt(standard),
      subject,
      totalMarks: parseInt(marks),
    };
    let breakdown = [];
    Object.keys(topicsConfig).forEach((key) => {
      breakdown.push({ topic: key, ...topicsConfig[key] });
    });
    blueprint.breakdown = breakdown;
    return blueprint;
  }

  const saveBlueprint = async () => {
    const blueprint = convertToBluePrintCompatibleFormat();
    const res = await putRequest(`${BASE_URL_API}/blueprint/create`, {
      blueprint,
    });
    if (!res.success) {
      alert(res.message ?? "Some Error Occurred");
    } else {
      alert("Blueprint saved successfully");
    }
  };

  const updateBlueprint = async () => {
    const blueprint = convertToBluePrintCompatibleFormat();
    const res = await putRequest(`${BASE_URL_API}/blueprint/update`, {
      id: bluePrintId,
      blueprint,
    });
    if (!res.success) {
      alert(res.message ?? "Some Error Occurred");
    } else {
      alert("Blueprint updated successfully");
    }
  };

  const RenderTopicSelection = useCallback(() => {
    const renderContent = marks
      ? `${configuredMarks} / ${marks}`
      : configuredMarks;
    return (
      <div className={formGroupClass}>
        <div className="flex items-center mb-2">
          <span
            className={`font-bold ${
              configuredMarks > parseInt(marks) ? "text-gray-400" : "text-black"
            }`}
          >
            Configured Marks: {renderContent}
          </span>
          {configuredMarks > parseInt(marks) && (
            <span className="text-gray-400 text-sm ml-2">
              (Exceeds total marks!)
            </span>
          )}
        </div>
        <label className={labelClass}>Select Topics</label>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <select
            className={selectClass}
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
          <div className="flex">
            <input
              className={inputClass}
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Or add custom topic"
            />
            <button
              className={`${actionButtonClass} ml-2`}
              onClick={handleAddCustomTopic}
            >
              +
            </button>
          </div>
        </div>
        {Object.keys(topicsConfig).length > 0 && (
          <div className="mt-2 flex flex-wrap">
            {Object.keys(topicsConfig).map((topic) => (
              <div key={topic} className={chipClass} style={{borderRadius:4}}>
                {topic}
                <button
                  className={chipRemoveButtonClass}
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

  const fetchBlueprints = async () => {
    setIsLoadingBlueprints(true);
    setBlueprintError("");
    try {
      const data = await getRequest(
        `${BASE_URL_API}/blueprint/getPaginatedBlueprints`,
        { limit: 10000 }
      );
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

  const handleOpenModal = () => {
    setIsModalOpen(true);
    fetchBlueprints();
  };

  const handleLoadBlueprint = (blueprint) => {
    setBluePrintId(blueprint.id);
    setHasLoadedBlueprint(true);
    setTitle(blueprint.name);
    setStandard(blueprint.grade.toString());
    setSubject(blueprint.subject);
    setMarks(blueprint.totalMarks.toString());

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
      timeDuration,
      numberOfSets: numberOfSets ? parseInt(numberOfSets) : 1,
    });
    try {
      const response = await postRequestWithoutStringified(
        `${BASE_URL_API}/questionPaper/generate`,
        body
      );
      console.log(response, "respo");
    } catch (e) {
      console.error(e);
    } finally {
      setIsAlertModalOpen(true);
    }
  };

  const handleAddDescriptiveQuestion = (topic) => {
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
  };

  return (
    <div className={containerClass}>
      <CustomAlert
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        message="Thank you for initiating the question paper generation. You will be notified as soon as the process is complete."
      />

      {/* Wrap the ChatHeader in a white background and pass prop to hide analyse reports */}
      <div className="bg-white">
        <ChatHeader title="Generate Question Paper" hideAnalyseReports />
      </div>

      <Blueprintmodal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <h2 className="mb-5 text-xl font-semibold">Select a Blueprint</h2>
        {isLoadingBlueprints ? (
          <p className="text-black">Loading blueprints...</p>
        ) : blueprintError ? (
          <p className="text-gray-600">{blueprintError}</p>
        ) : blueprints.length === 0 ? (
          <p className="text-gray-600">No blueprints found.</p>
        ) : (
          <div>
            {blueprints.map((bp) => (
              <div key={bp.id} className={blueprintItemClass}>
                <div className={blueprintHeaderClass}>
                  <div>
                    <h3 className="text-black mb-1">{bp.name}</h3>
                    <p className="text-black m-0">
                      Grade: {bp.grade} | Subject: {bp.subject} | Total Marks:{" "}
                      {bp.totalMarks}
                    </p>
                    <p className="text-gray-600 my-1">
                      Created At:{" "}
                      {new Date(bp.createdAt).toLocaleDateString("en-GB")}
                    </p>
                    {bp.createdAt !== bp.updatedAt && (
                      <p className="text-gray-600 m-0">
                        Last Updated:{" "}
                        {new Date(bp.updatedAt).toLocaleDateString("en-GB")}
                      </p>
                    )}
                  </div>
                  <button
                    className={`${actionButtonClass} btn-hover`}
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

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/2">
          <div className={cardClass}>
            <h2 className={cardTitleClass}>Exam Details</h2>
            <div className={formGroupClass}>
              <label className={labelClass}>
                Title <span className="text-red-500">*</span>
              </label>
              <input
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="12 Std. Question Paper"
              />
            </div>
            <div className={formGroupClass}>
              <label className={labelClass}>Academy Name</label>
              <input
                className={inputClass}
                value={academyName}
                onChange={(e) => setAcademyName(e.target.value)}
                placeholder="E.g., Springfield High"
              />
            </div>
            <div className={formGroupClass}>
              <label className={labelClass}>
                Standard <span className="text-red-500">*</span>
              </label>
              <select
                className={selectClass}
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
            <div className={formGroupClass}>
              <label className={labelClass}>
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                className={selectClass}
                value={subject}
                onChange={(e) => {
                  setHasLoadedBlueprint(false);
                  setSubject(e.target.value);
                }}
              >
                <option value="">Select Subject</option>
                <option value="Science">Science</option>
                <option value="Maths">Maths</option>
              </select>
            </div>
            <div className={formGroupClass}>
              <label className={labelClass}>
                Total Marks <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                className={inputClass}
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                placeholder="e.g. 100"
              />
            </div>
            <div className={formGroupClass}>
              <label className={labelClass}>
                Time Duration <span className="text-red-500">*</span>
              </label>
              <input
                className={inputClass}
                value={timeDuration}
                onChange={(e) => setTimeDuration(e.target.value)}
                placeholder="e.g. 2 Hours"
              />
            </div>
            <div className={formGroupClass}>
              <label className={labelClass}>Number of Sets</label>
              <input
                type="number"
                className={inputClass}
                value={numberOfSets}
                onChange={(e) => setNumberOfSets(e.target.value)}
                placeholder="e.g. 3"
              />
            </div>
            <div className={formGroupClass}>
              <label className={labelClass}>Additional Instructions</label>
              <input
                type="text"
                className={inputClass}
                value={anyotherQuery}
                onChange={(e) => setAnyOtherQuery(e.target.value)}
                placeholder="e.g. Mark problems as section A"
              />
            </div>
          </div>
        </div>
        {marks && (
          <div className="md:w-1/2">
            <div className={cardClass}>
              <h2 className={cardTitleClass}>Topic Configuration</h2>
              {topics.length > 0 && <RenderTopicSelection />}
              {Object.keys(topicsConfig).length > 0 && (
                <div className="space-y-4">
                  {Object.entries(topicsConfig).map(([topic, config]) => (
                    <div
                      key={topic}
                      className="p-4 border border-gray-200 rounded-lg shadow-sm fade-in"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {topic}
                        </h3>
                        <button
                          className={`${actionButtonClass} btn-hover`}
                          onClick={() => handleRemoveTopic(topic)}
                        >
                          Remove
                        </button>
                      </div>
                      <div className={gridThreeClass}>
                        <div className="flex flex-col">
                          <label className="text-sm text-gray-800 mb-1">
                            Easy MCQs
                          </label>
                          <input
                            className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
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
                        <div className="flex flex-col">
                          <label className="text-sm text-gray-800 mb-1">
                            Medium MCQs
                          </label>
                          <input
                            className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
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
                        <div className="flex flex-col">
                          <label className="text-sm text-gray-800 mb-1">
                            Hard MCQs
                          </label>
                          <input
                            className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
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
                      {config.descriptiveQuestionConfig &&
                        config.descriptiveQuestionConfig.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-md font-semibold mb-2">
                              Descriptive Questions
                            </h4>
                            {config.descriptiveQuestionConfig.map(
                              (descConfig, index) => (
                                <div
                                  key={index}
                                  className="flex flex-col md:flex-row gap-4 items-center mb-2"
                                >
                                  <div className="flex flex-col">
                                    <label className="text-sm text-gray-800 mb-1">
                                      Marks
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                      value={descConfig.marks}
                                      onChange={(e) =>
                                        handleDescriptiveQuestionChange(
                                          topic,
                                          index,
                                          "marks",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="flex flex-col">
                                    <label className="text-sm text-gray-800 mb-1">
                                      Difficulty
                                    </label>
                                    <select
                                      className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                      value={descConfig.difficulty}
                                      onChange={(e) =>
                                        handleDescriptiveQuestionChange(
                                          topic,
                                          index,
                                          "difficulty",
                                          e.target.value
                                        )
                                      }
                                    >
                                      <option value="">
                                        Select Difficulty
                                      </option>
                                      <option value="easy">Easy</option>
                                      <option value="medium">Medium</option>
                                      <option value="hard">Hard</option>
                                    </select>
                                  </div>
                                  <div className="flex flex-col">
                                    <label className="text-sm text-gray-800 mb-1">
                                      No. Of Questions
                                    </label>
                                    <input
                                      className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                      value={descConfig.noOfQuestions}
                                      onChange={(e) =>
                                        handleDescriptiveQuestionChange(
                                          topic,
                                          index,
                                          "noOfQuestions",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>
                                  <button
                                    className={`${chipRemoveButtonClass} btn-hover`}
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
                              )
                            )}
                          </div>
                        )}
                      <div className="mt-2">
                        <button
                          className={`${actionButtonClass} btn-hover`}
                          onClick={() => handleAddDescriptiveQuestion(topic)}
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

      {/* Bottom action buttons arranged horizontally */}
      <div className="mt-6 flex gap-4">
        <button
          className={`${actionButtonClass} btn-hover`}
          onClick={handleGenerateQuestionPaper}
          disabled={
            !standard ||
            !subject ||
            isLoading ||
            isMarksExceeded ||
            !title ||
            !marks ||
            !timeDuration ||
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
          className={`${actionButtonClass} btn-hover`}
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
        <button
          className={`${actionButtonClass} btn-hover`}
          onClick={handleOpenModal}
        >
          Load from existing blueprint
        </button>
      </div>
    </div>
  );
};

export default GenerateQuestionPaper;
