/* GenerateQuestionPaper.jsx */

import React, { useState, useEffect } from "react";
import { ChatHeader } from "../../subcomponents/ChatHeader";
import CustomAlert from "../../subcomponents/CustomAlert";
import { styles } from "./styles";
import { allTopics } from "../../constants/allTopics";
import { ACCESS_KEY,BASE_URL_API } from "../../constants/constants";
import { putRequest} from "../../utils/ApiCall";
import {
  generateQuestionsArray,
  reorderQuestionsByType,
} from "../../utils/generateJsonToPassToReceiveJson";

// Import our refactored components
import ExamDetailsForm from "./ExamDetailsForm";
import TopicConfiguration from "./TopicConfiguration";
import BlueprintModal from "./BlueprintModal";

/**
 * GenerateQuestionPaper
 *
 * Main component to configure exam details, topics, and generate question paper.
 */
export const GenerateQuestionPaper = () => {
  // -- Exam Details State --
  const [title, setTitle] = useState("");
  const [academyName, setAcademyName] = useState("Knowledge High School");
  const [standard, setStandard] = useState("");
  const [subject, setSubject] = useState("");
  const [marks, setMarks] = useState("");
  const [timeDuration, setTimeDuration] = useState("");
  const [numberOfSets, setNumberOfSets] = useState(1);
  const [anyotherQuery, setAnyOtherQuery] = useState("");

  // -- Blueprint / Topics Configuration State --
  const [topics, setTopics] = useState([]);
  const [topicsConfig, setTopicsConfig] = useState({});
  const [customTopic, setCustomTopic] = useState("");
  const [configuredMarks, setConfiguredMarks] = useState(0);
  const [hasLoadedBlueprint, setHasLoadedBlueprint] = useState(false);
  const [bluePrintId, setBluePrintId] = useState(null);

  // -- Loading & Alert States --
  const [isLoading, setIsLoading] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  // -- Blueprint Modal State --
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [blueprints, setBlueprints] = useState([]);
  const [isLoadingBlueprints, setIsLoadingBlueprints] = useState(false);
  const [blueprintError, setBlueprintError] = useState("");

  /**
   * Update topics list whenever subject or standard changes,
   * unless a blueprint has already been loaded (in which case do not reset).
   */
  useEffect(() => {
    if (standard && subject) {
      const topicList = allTopics[subject]?.[standard] || [];
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

  /**
   * Convert local topic configuration to a blueprint-compatible format.
   * This format is used for saving/updating blueprints.
   */
  const convertToBluePrintCompatibleFormat = () => {
    let blueprint = {
      name: title,
      grade: parseInt(standard),
      subject,
      totalMarks: parseInt(marks),
      breakdown: [],
    };
    Object.keys(topicsConfig).forEach((topic) => {
      blueprint.breakdown.push({
        topic,
        ...topicsConfig[topic],
      });
    });
    return blueprint;
  };

  /**
   * Save blueprint to the server.
   * If successful, alerts the user. Otherwise shows an error.
   */
  const saveBlueprint = async () => {
    try {
      const blueprint = convertToBluePrintCompatibleFormat();
      const res = await putRequest(
        `${BASE_URL_API}/blueprint/create`,
        {
          Authorization: `${localStorage.getItem(ACCESS_KEY)}`,
          "Content-Type": "application/json",
        },
        { blueprint }
      );
      if (!res.success) {
        alert(res.message ?? "Some Error Occurred");
      } else {
        alert("Blueprint saved successfully");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to save blueprint. Please try again.");
    }
  };

  /**
   * Update an existing blueprint on the server.
   */
  const updateBlueprint = async () => {
    try {
      const blueprint = convertToBluePrintCompatibleFormat();
      const res = await putRequest(
        `${BASE_URL_API}/blueprint/update`,
        {
          Authorization: `${localStorage.getItem(ACCESS_KEY)}`,
          "Content-Type": "application/json",
        },
        { id: bluePrintId, blueprint }
      );
      if (!res.success) {
        alert(res.message ?? "Some Error Occurred");
      } else {
        alert("Blueprint updated successfully");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to update blueprint. Please try again.");
    }
  };

  /**
   * Fetch blueprints from the server (paginated).
   * The fetched data is displayed in the modal for user selection.
   */
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

      if (data.success) {
        setBlueprints(data.blueprints);
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

  /**
   * Opens the blueprint modal and triggers fetching blueprint list.
   */
  const handleOpenModal = () => {
    setIsModalOpen(true);
    fetchBlueprints();
  };

  /**
   * Loads the selected blueprint into the form (exam details + topic config).
   */
  const handleLoadBlueprint = (blueprint) => {
    // Basic exam details
    setBluePrintId(blueprint.id);
    setHasLoadedBlueprint(true);
    setTitle(blueprint.name);
    setStandard(blueprint.grade.toString());
    setSubject(blueprint.subject);
    setMarks(blueprint.totalMarks.toString());

    // Convert blueprint breakdown into local state
    const newTopicsConfig = {};
    let totalConfiguredMarks = 0;

    blueprint.breakdown.forEach((item) => {
      newTopicsConfig[item.topic] = {
        easyMCQs: item.easyMCQs,
        mediumMCQs: item.mediumMCQs,
        hardMCQs: item.hardMCQs,
        mcqMarks: item.mcqMarks,
        descriptiveQuestionConfig: (item.descriptiveQuestionConfig || []).map(
          (desc) => ({
            marks: desc.marks.toString(),
            difficulty: desc.difficulty,
            noOfQuestions: desc.noOfQuestions.toString(),
          })
        ),
      };

      // Calculate total marks contributed by MCQs
      totalConfiguredMarks +=
        (item.easyMCQs + item.mediumMCQs + item.hardMCQs) * item.mcqMarks;

      // And by descriptive questions
      (item.descriptiveQuestionConfig || []).forEach((desc) => {
        totalConfiguredMarks += desc.marks * desc.noOfQuestions;
      });
    });

    setTopicsConfig(newTopicsConfig);
    setConfiguredMarks(totalConfiguredMarks);

    // Close modal
    setIsModalOpen(false);
  };

  /**
   * Generate the question paper by sending the blueprint to the backend.
   * Displays an alert once the request is initiated.
   */
  const handleGenerateQuestionPaper = async () => {
    setIsLoading(true);

    // Reorder questions by type before sending
    const blueprint = reorderQuestionsByType(
      generateQuestionsArray(topicsConfig)
    );

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
      // any additional instructions can also be passed here if the API supports
    });

    try {
      const url = new URL(`${BASE_URL_API}/questionPaper/generate`);
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem(ACCESS_KEY),
        },
        body,
      };
      const response = await fetch(url.toString(), requestOptions);
      // If needed, handle the response data:
      // const data = await response.json();

      // Show success alert
      setIsAlertModalOpen(true);
    } catch (error) {
      console.error(error);
      alert("Failed to generate question paper. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check if total configured marks exceed the total exam marks,
   * or if required fields are missing (disable generate button if so).
   */
  const isMarksExceeded = configuredMarks > parseInt(marks || 0);
  const isGenerateDisabled =
    !standard ||
    !subject ||
    isLoading ||
    isMarksExceeded ||
    !title ||
    !marks ||
    !timeDuration ||
    configuredMarks !== parseInt(marks || 0);

  return (
    <div style={styles.pageContainer} className="fade-in">
      {/* Alert to confirm generation request */}
      <CustomAlert
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        message="Thank you for initiating the question paper generation. You will be notified as soon as the process is complete."
      />

      {/* Blueprint Modal */}
      <BlueprintModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        blueprints={blueprints}
        isLoadingBlueprints={isLoadingBlueprints}
        blueprintError={blueprintError}
        handleLoadBlueprint={handleLoadBlueprint}
      />

      {/* Page Header */}
      <ChatHeader title="Generate Question Paper" />

      {/* Load from existing blueprint button */}
      <div style={{ marginBottom: "20px", textAlign: "right" }}>
        <button style={styles.loadButton} className="btn-hover" onClick={handleOpenModal}>
          Load from existing blueprint
        </button>
      </div>

      <div style={styles.container}>
        {/* LEFT COLUMN: ExamDetailsForm */}
        <div style={styles.formContainer}>
          <div style={styles.columnLeft}>
            <ExamDetailsForm
              title={title}
              academyName={academyName}
              standard={standard}
              subject={subject}
              marks={marks}
              timeDuration={timeDuration}
              numberOfSets={numberOfSets}
              anyotherQuery={anyotherQuery}
              setTitle={setTitle}
              setAcademyName={setAcademyName}
              setStandard={setStandard}
              setSubject={setSubject}
              setMarks={setMarks}
              setTimeDuration={setTimeDuration}
              setNumberOfSets={setNumberOfSets}
              setAnyOtherQuery={setAnyOtherQuery}
              setHasLoadedBlueprint={setHasLoadedBlueprint}
            />
          </div>

          {/* RIGHT COLUMN: TopicConfiguration */}
          <div style={styles.columnRight}>
            <TopicConfiguration
              subject={subject}
              standard={standard}
              configuredMarks={configuredMarks}
              marks={marks}
              topics={topics}
              topicsConfig={topicsConfig}
              hasLoadedBlueprint={hasLoadedBlueprint}
              setTopicsConfig={setTopicsConfig}
              setConfiguredMarks={setConfiguredMarks}
              customTopic={customTopic}
              setCustomTopic={setCustomTopic}
            />
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div style={styles.actionContainer}>
          <button
            style={styles.generateButton}
            className="btn-hover"
            onClick={handleGenerateQuestionPaper}
            disabled={isGenerateDisabled}
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
              configuredMarks !== parseInt(marks || 0)
            }
          >
            {hasLoadedBlueprint ? "Update Blueprint" : "Save BluePrint"}
          </button>
        </div>
      </div>
    </div>
  );
};

