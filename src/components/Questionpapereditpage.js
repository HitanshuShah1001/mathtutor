/**
 * This file defines the QuestionPaperEditPage component, which provides a comprehensive
 * interface for editing a question paper. It supports:
 * - Creating new sections
 * - Adding questions within sections
 * - Editing and deleting existing questions
 * - Drag-and-drop reordering of questions
 * - Marking certain questions as optional
 * - Importing questions from a question bank
 *
 * MAIN FLOW:
 * 1. The page fetches the existing sections (and their questions) for a given question paper (docId).
 * 2. Users can add sections, add new questions, or modify/delete existing ones.
 * 3. A drag-and-drop functionality (react-beautiful-dnd) allows rearranging questions in a section.
 * 4. Users can mark exactly two non-MCQ questions as optional, grouping them together via an `optionalGroupId`.
 * 5. A right panel displays detailed editing controls for the currently selected question (clicked on the left list).
 * 6. The user can also resize the panels by dragging a horizontal handle between the left and right sections.
 */

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Trash,
  Image as ImageIcon,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import { postRequest, getRequest } from "../utils/ApiCall";
import { uploadToS3 } from "../utils/s3utils";
import { BASE_URL_API } from "../constants/constants";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { modalContainerClass, modalContentClass } from "./QuestionBank";
import { v4 as uuidv4 } from "uuid";
import { QuestionBankModal } from "./CustomQuestionPaperGeneration";

/**
 * Main component that orchestrates the UI and logic for editing a question paper.
 * Allows adding/editing/deleting questions and sections, drag-and-drop reordering,
 * marking optional questions, and more.
 */
const QuestionPaperEditPage = () => {
  // Retrieve questionPaperId from route params
  const { docId: questionPaperId } = useParams();

  // ---------------------------------------
  // State management
  // ---------------------------------------
  // sections: an array of objects, each containing a 'name' and an array of 'questions'
  const [sections, setSections] = useState([]);

  // originalQuestion: The question object as it originally existed (before edits).
  // editedQuestion: The question object that the user is currently editing.
  const [originalQuestion, setOriginalQuestion] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState(null);

  // questionImageFile: If a new image is uploaded for a question, store the File object here.
  const [questionImageFile, setQuestionImageFile] = useState(null);

  // searchTerm: For filtering the question list on the left panel by question text
  const [searchTerm, setSearchTerm] = useState("");

  // Modals and related states:
  // - showAddQuestionModal: Toggles the form for adding a new question
  // - isEditingNewQuestion: True if we're editing a just-created question instead of an existing one
  // - sectionForNewQuestion: The section name where a new question is being added
  // - showBankModal: Manages visibility for importing questions from a question bank
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [isEditingNewQuestion, setIsEditingNewQuestion] = useState(false);
  const [sectionForNewQuestion, setSectionForNewQuestion] = useState(null);
  const [showBankModal, setShowBankModal] = useState({
    visible: false,
    sectionName: null,
  });

  // newQuestion: Template for a newly created question, including type, text, options, etc.
  const [newQuestion, setNewQuestion] = useState({
    type: "MCQ",
    questionText: "",
    imageUrl: "",
    marks: "",
    difficulty: "",
    options: [
      { key: "A", option: "", imageUrl: "" },
      { key: "B", option: "", imageUrl: "" },
      { key: "C", option: "", imageUrl: "" },
      { key: "D", option: "", imageUrl: "" },
    ],
  });

  // For managing the creation of a new section:
  // - showAddSectionModal: Toggle the modal for new section creation
  // - newSectionName: Controlled input state for the new section's name
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");

  // selectedOptionalQuestions: For tracking which questions (2 at a time) are selected
  // to be marked as optional
  const [selectedOptionalQuestions, setSelectedOptionalQuestions] = useState(
    []
  );

  // collapsedSections: Object storing boolean collapse states for each section, keyed by index
  const [collapsedSections, setCollapsedSections] = useState({});

  // ---------------------------------------
  // Panel resizing state
  // ---------------------------------------
  const [leftPanelWidth, setLeftPanelWidth] = useState(33);
  const [isResizing, setIsResizing] = useState(false);

  /**
   * Helper function to get the next alphabetical letter for naming a new section:
   * e.g., if existing sections are A, B, C, it returns D.
   */
  const getNextSectionLetter = () => {
    if (!sections || sections.length === 0) return "A";
    const letters = sections
      .map((sec) => sec.name.trim().toUpperCase())
      .filter((name) => /^[A-Z]$/.test(name));
    if (letters.length === 0) return "A";
    const maxLetter = letters.reduce((prev, curr) =>
      curr.charCodeAt(0) > prev.charCodeAt(0) ? curr : prev
    );
    const nextCharCode = maxLetter.charCodeAt(0) + 1;
    if (nextCharCode > "Z".charCodeAt(0)) return "A"; // loop if needed
    return String.fromCharCode(nextCharCode);
  };

  /**
   * Handler to add a new section to the question paper.
   * If successful, the new section is appended and a modal to add a question is optionally triggered.
   */
  const handleAddSection = async () => {
    if (!newSectionName.trim()) {
      alert("Please enter a valid section name.");
      return;
    }
    const newSection = { name: newSectionName.trim(), questions: [] };
    const updatedSections = [...sections, newSection];
    setSections(updatedSections);

    const payload = { id: questionPaperId, sections: updatedSections };
    const response = await postRequest(
      `${BASE_URL_API}/questionPaper/update`,
      payload
    );
    if (!response?.success) {
      alert("Failed to add new section. Please try again.");
      return;
    }

    setShowAddSectionModal(false);
    setNewSectionName("");

    // Optionally open the "Add Question" modal right after adding a new section
    setSectionForNewQuestion(newSection.name);
    setShowAddQuestionModal(true);
  };

  /**
   * toggleSectionCollapse: Toggles the visual collapse/expand state of a given section by index.
   */
  const toggleSectionCollapse = (sectionIndex) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionIndex]: !prev[sectionIndex],
    }));
  };

  /**
   * Panel resizing hooks:
   * - On mouse move, if isResizing is true, update leftPanelWidth to the new percentage based on the cursor.
   * - On mouse up, end the resizing operation.
   */
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      let newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth < 25) newWidth = 25;
      if (newWidth > 50) newWidth = 50;
      setLeftPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  /**
   * handleMouseDown: Sets isResizing to true when the user clicks down on the resize handle.
   */
  const handleMouseDown = () => {
    setIsResizing(true);
  };

  // ---------------------------------------
  // FETCH/REFRESH QUESTION PAPER
  // ---------------------------------------
  /**
   * fetchQuestionPaperDetails: Retrieves the question paper's sections and questions from the server.
   */
  const fetchQuestionPaperDetails = async () => {
    try {
      const response = await getRequest(
        `${BASE_URL_API}/questionPaper/${questionPaperId}`
      );
      if (response.success) {
        setSections(response.questionPaper.sections || []);
      } else {
        console.error("Failed to fetch question paper details:", response);
      }
    } catch (error) {
      console.error("Error fetching question paper details:", error);
    }
  };

  /**
   * On mount, fetch the question paper details. Also re-fetch when questionPaperId changes.
   */
  useEffect(() => {
    fetchQuestionPaperDetails();
  }, []);

  // ---------------------------------------
  // EDIT functionalities
  // ---------------------------------------
  /**
   * handleQuestionClick: When the user clicks on a question in the left panel,
   * we store the question as both originalQuestion and editedQuestion (for toggling changes).
   */
  const handleQuestionClick = (question) => {
    setOriginalQuestion(question);
    setEditedQuestion(JSON.parse(JSON.stringify(question)));
    setQuestionImageFile(null);
  };

  /**
   * isModified: Checks if the currently edited question has any changes compared to the original.
   */
  const isModified =
    editedQuestion && originalQuestion
      ? JSON.stringify(editedQuestion) !== JSON.stringify(originalQuestion) ||
        questionImageFile !== null
      : false;

  /**
   * renderTextWithMath: Splits text by '$' and renders inline math in between.
   * This is used for live preview of math expressions in the question text.
   */
  const renderTextWithMath = (text) => {
    if (!text) return null;
    const parts = text.split("$");
    return parts.map((part, index) =>
      index % 2 === 1 ? (
        <InlineMath key={index} math={part} />
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  /**
   * renderTruncatedTextWithMath: Same as renderTextWithMath, but truncates the text to maxLength chars.
   * Used in the left panel question list.
   */
  const renderTruncatedTextWithMath = (text, maxLength = 60) => {
    if (!text) return null;
    let truncated = text;
    if (text.length > maxLength) {
      truncated = text.slice(0, maxLength) + "...";
    }
    const parts = truncated.split("$");
    return parts.map((part, index) =>
      index % 2 === 1 ? (
        <InlineMath key={index} math={part} />
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  /**
   * getFilteredSections: Filters out questions (and thus sections) that do not match the search term.
   */
  const getFilteredSections = () => {
    const lowerSearch = searchTerm?.toLowerCase();
    const filtered = sections.map((section) => {
      const filteredQuestions = section.questions.filter((q) =>
        q.questionText?.toLowerCase().includes(lowerSearch)
      );
      return { ...section, questions: filteredQuestions };
    });
    return filtered.filter((section) => section.questions.length > 0);
  };

  /**
   * visibleSections: The sections that pass the search filter (displayed on the left panel).
   */
  const visibleSections = getFilteredSections();
  const isEditingMath = editedQuestion?.questionText?.includes("$");

  /**
   * toggleOptionalSelection: Allows user to select up to 2 non-MCQ questions to be marked as optional.
   */
  const toggleOptionalSelection = (questionId, e) => {
    e.stopPropagation();
    setSelectedOptionalQuestions((prev) => {
      if (prev.includes(questionId)) {
        return prev.filter((id) => id !== questionId);
      } else {
        if (prev.length < 2) {
          return [...prev, questionId];
        }
        return prev;
      }
    });
  };

  /**
   * handleMarkAsOptional: Groups exactly 2 selected questions under the same `optionalGroupId`.
   */
  const handleMarkAsOptional = async () => {
    if (selectedOptionalQuestions.length !== 2) return;
    const optionalGroupId = uuidv4();
    const updatedSections = sections.map((section) => {
      const updatedQuestions = section.questions.map((q) => {
        if (selectedOptionalQuestions.includes(q.id)) {
          return { ...q, optionalGroupId };
        }
        return q;
      });
      return { ...section, questions: updatedQuestions };
    });
    setSections(updatedSections);

    const payload = { id: questionPaperId, sections: updatedSections };
    const response = await postRequest(
      `${BASE_URL_API}/questionPaper/update`,
      payload
    );
    if (response.success) {
      alert("Questions marked as optional successfully!");
      setSelectedOptionalQuestions([]);
      await fetchQuestionPaperDetails();
    } else {
      alert("Failed to mark questions as optional.");
    }
  };

  // ---------------------------------------
  // EDIT: changes for question fields
  // ---------------------------------------
  /**
   * handleQuestionTextChange: Updates the question text as the user types in the right panel.
   */
  const handleQuestionTextChange = (e) => {
    const newText = e.target.value;
    setEditedQuestion((prev) => ({
      ...prev,
      questionText: newText,
    }));
  };

  /**
   * handleTypeChange: Updates the question type (MCQ vs descriptive).
   */
  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setEditedQuestion((prev) => ({
      ...prev,
      type: newType,
    }));
  };

  /**
   * handleImportQuestions: Triggered when user imports selected questions from the bank
   * to a specific section within the current question paper.
   */
  const handleImportQuestions = async (selectedIds) => {
    if (!selectedIds || selectedIds.length === 0) {
      setShowBankModal({ visible: false, sectionName: null });
      return;
    }
    const foundSection = sections.find(
      (sec) => sec.name === showBankModal.sectionName
    );
    const baseIndex = foundSection ? foundSection.questions.length : 0;
    const questionDetails = selectedIds.map((qId, i) => ({
      questionId: qId,
      orderIndex: baseIndex + i + 1,
      section: showBankModal.sectionName,
    }));
    try {
      const body = {
        questionPaperId: parseInt(questionPaperId),
        questionDetails,
      };
      const resp = await postRequest(
        `${BASE_URL_API}/questionPaper/addQuestions`,
        body
      );
      if (resp?.success) {
        alert("Imported questions successfully!");
        await fetchQuestionPaperDetails();
      } else {
        alert("Failed to import questions.");
      }
    } catch (err) {
      console.error("Error importing questions:", err);
      alert("Error importing questions.");
    }
    setShowBankModal({ visible: false, sectionName: null });
  };

  /**
   * handleDifficultyChange: Sets the difficulty field of the currently edited question.
   */
  const handleDifficultyChange = (e) => {
    const newDiff = e.target.value;
    setEditedQuestion((prev) => ({
      ...prev,
      difficulty: newDiff,
    }));
  };

  /**
   * handleMarksChange: Sets the marks field of the currently edited question.
   */
  const handleMarksChange = (e) => {
    const newMarks = e.target.value;
    setEditedQuestion((prev) => ({
      ...prev,
      marks: newMarks,
    }));
  };

  /**
   * handleOptionChange: For MCQ questions, updates the text of a specific option.
   */
  const handleOptionChange = (index, newValue) => {
    setEditedQuestion((prev) => {
      const updatedOptions = [...(prev.options || [])];
      updatedOptions[index] = {
        ...updatedOptions[index],
        option: newValue,
      };
      return { ...prev, options: updatedOptions };
    });
  };

  // ---------------------------------------
  // EDIT: images (question & options)
  // ---------------------------------------
  /**
   * handleQuestionImageChange: Stores the File object for the question image being uploaded.
   */
  const handleQuestionImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setQuestionImageFile(file);
    }
  };

  /**
   * handleDeleteQuestionImage: Clears the existing question image reference.
   */
  const handleDeleteQuestionImage = () => {
    setQuestionImageFile(null);
    setEditedQuestion((prev) => ({ ...prev, imageUrl: "" }));
  };

  /**
   * handleDiscardQuestionImage: Discards the newly selected image (go back to original).
   */
  const handleDiscardQuestionImage = () => {
    setQuestionImageFile(null);
  };

  /**
   * handleOptionImageChange: Handles new file upload for a specific MCQ option image.
   */
  const handleOptionImageChange = (index, file) => {
    setEditedQuestion((prev) => {
      const updatedOptions = [...(prev.options || [])];
      updatedOptions[index] = {
        ...updatedOptions[index],
        imageFile: file,
      };
      return { ...prev, options: updatedOptions };
    });
  };

  /**
   * handleDeleteOptionImage: Removes the existing imageUrl and imageFile for a given option.
   */
  const handleDeleteOptionImage = (index) => {
    setEditedQuestion((prev) => {
      const updatedOptions = [...(prev.options || [])];
      delete updatedOptions[index].imageUrl;
      delete updatedOptions[index].imageFile;
      return { ...prev, options: updatedOptions };
    });
  };

  /**
   * handleDiscardOptionImage: Discards a newly chosen image file for an option, reverting to the old image.
   */
  const handleDiscardOptionImage = (index) => {
    setEditedQuestion((prev) => {
      const updatedOptions = [...(prev.options || [])];
      if (updatedOptions[index].imageFile) {
        delete updatedOptions[index].imageFile;
      }
      return { ...prev, options: updatedOptions };
    });
  };

  // ---------------------------------------
  // Saving / Upserting an existing question
  // ---------------------------------------
  /**
   * handleSave: Saves changes to the currently edited question (editedQuestion).
   * This includes uploading images to S3 if they've changed.
   */
  const handleSave = async () => {
    try {
      let updatedImageUrl = editedQuestion.imageUrl || "";
      // If a new question image file is selected, upload to S3
      if (questionImageFile) {
        const generatedLink = `https://tutor-staffroom-files.s3.amazonaws.com/${Date.now()}-${
          questionImageFile.name
        }`;
        updatedImageUrl = await uploadToS3(questionImageFile, generatedLink);
      }

      // For each MCQ option that has a new image file, upload it
      const updatedOptions = await Promise.all(
        (editedQuestion.options || []).map(async (opt) => {
          let updatedOption = { ...opt };
          if (opt.imageFile) {
            const generatedLink = `https://tutor-staffroom-files.s3.amazonaws.com/${Date.now()}-${
              opt.imageFile.name
            }`;
            const uploadedUrl = await uploadToS3(opt.imageFile, generatedLink);
            updatedOption.imageUrl = uploadedUrl;
            delete updatedOption.imageFile;
          }
          return updatedOption;
        })
      );

      // Construct the final question payload
      const updatedQuestion = {
        ...editedQuestion,
        imageUrl: updatedImageUrl,
        options: updatedOptions,
      };

      let payload = {
        ...updatedQuestion,
        difficulty: updatedQuestion.difficulty?.toLowerCase(),
        questionPaperId,
      };
      if (originalQuestion) {
        payload.id = updatedQuestion.id;
      }
      // If not MCQ, remove "options" array from payload
      if (updatedQuestion.type !== "MCQ") {
        delete payload.options;
      }

      const response = await postRequest(
        `${BASE_URL_API}/question/upsert`,
        payload
      );
      if (response && response.success) {
        alert("Question upserted successfully!");
      } else {
        alert("Failed to upsert question.");
      }

      await fetchQuestionPaperDetails();
      // Clear editing states
      setOriginalQuestion(null);
      setEditedQuestion(null);
      setQuestionImageFile(null);
    } catch (error) {
      console.error("Error upserting question:", error);
      alert("Error upserting question.");
    }
  };

  // ---------------------------------------
  // DELETE question
  // ---------------------------------------
  /**
   * handleDeleteQuestion: Removes a question from the question paper entirely, updating the server.
   */
  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      try {
        const res = await postRequest(
          `${BASE_URL_API}/questionPaper/removeQuestion`,
          {
            questionId,
            questionPaperId: parseInt(questionPaperId),
          }
        );
        if (res.success) {
          alert("Question deleted successfully");
        } else {
          alert("Failed to delete question.");
        }
        await fetchQuestionPaperDetails();
        // If currently editing the deleted question, clear the editing states
        if (editedQuestion && editedQuestion.id === questionId) {
          setOriginalQuestion(null);
          setEditedQuestion(null);
        }
      } catch (error) {
        console.error("Error deleting question:", error);
        alert("Error deleting question.");
      }
    }
  };

  // ---------------------------------------
  // DRAG & DROP reorder logic
  // ---------------------------------------
  /**
   * handleDragEnd: When the user finishes dragging a question, update local section ordering
   * and notify the server via `questionPaper/update`.
   */
  const handleDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;

    if (source.droppableId === destination.droppableId) {
      // Reorder within the same section
      const sectionIndex = parseInt(source.droppableId, 10);
      const section = sections[sectionIndex];
      const newQuestions = Array.from(section.questions);
      const [removed] = newQuestions.splice(source.index, 1);
      newQuestions.splice(destination.index, 0, removed);

      const updatedSections = [...sections];
      updatedSections[sectionIndex] = { ...section, questions: newQuestions };
      setSections(updatedSections);

      const payload = { id: questionPaperId, sections: updatedSections };
      const response = await postRequest(
        `${BASE_URL_API}/questionPaper/update`,
        payload
      );
      if (!response.success) {
        console.error("Failed to update question paper order", response);
      }
      await fetchQuestionPaperDetails();
    } else {
      // TODO: Implement cross-section drag if needed
    }
  };

  // ---------------------------------------
  // ADD NEW QUESTION
  // ---------------------------------------
  /**
   * handleAddQuestionForSection: Called when user clicks "Add New Question" for a specific section.
   * Opens the modal to create a new question for that section.
   */
  const handleAddQuestionForSection = (sectionName) => {
    setSectionForNewQuestion(sectionName);
    setShowAddQuestionModal(true);
    setIsEditingNewQuestion(false);
    setNewQuestion({
      type: "MCQ",
      questionText: "",
      imageUrl: "",
      marks: "",
      difficulty: "",
      options: [
        { key: "A", option: "", imageUrl: "" },
        { key: "B", option: "", imageUrl: "" },
        { key: "C", option: "", imageUrl: "" },
        { key: "D", option: "", imageUrl: "" },
      ],
    });
  };

  /**
   * handleNewQuestionChange: Updates the newQuestion state as user types in the modal (type, text, marks, etc.).
   * For MCQ options, we also track the relevant index.
   */
  const handleNewQuestionChange = (e, field, index) => {
    const { value } = e.target;
    if (
      field === "type" ||
      field === "questionText" ||
      field === "marks" ||
      field === "difficulty"
    ) {
      setNewQuestion((prev) => ({ ...prev, [field]: value }));
    } else if (field === "option" && typeof index === "number") {
      setNewQuestion((prev) => {
        const newOptions = [...prev.options];
        newOptions[index].option = value;
        return { ...prev, options: newOptions };
      });
    }
  };

  /**
   * handleMathKeyDown: Optional handler to detect SHIFT + $ for math insertion in new questions or options.
   */
  const handleMathKeyDown = (e, field, index) => {
    // Implementation detail: optional custom logic
  };

  /**
   * handleQuestionImageUpload: Updates the local state with a file and a preview URL for the new question's image.
   */
  const handleQuestionImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const imageUrl = URL.createObjectURL(file);
    setNewQuestion((prev) => ({ ...prev, imageFile: file, imageUrl }));
  };

  /**
   * handleOptionImageUpload: Similar to handleQuestionImageUpload, but for a specific MCQ option.
   */
  const handleOptionImageUpload = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    const imageUrl = URL.createObjectURL(file);
    setNewQuestion((prev) => {
      const newOptions = [...prev.options];
      newOptions[index] = {
        ...newOptions[index],
        imageFile: file,
        imageUrl,
      };
      return { ...prev, options: newOptions };
    });
  };

  /**
   * calculateOrderIndex: Stub function to decide where to place the new question in order.
   * Custom logic can be inserted here. For now, returns 1 or a simple value.
   */
  const calculateOrderIndex = (sectionName) => {
    const foundSection = sections.find((sec) => sec.name === sectionName);
    if (!foundSection) return 1;
    // e.g. length + 1
    return foundSection.questions.length + 1;
  };

  /**
   * handleNewQuestionSubmit: Creates or updates a new question for the currently selected section,
   * including image uploads if necessary.
   */
  const handleNewQuestionSubmit = async () => {
    try {
      let updatedImageUrl = newQuestion.imageUrl || "";
      // If a new image is chosen, upload to S3
      if (newQuestion.imageFile) {
        const generatedLink = `https://tutor-staffroom-files.s3.amazonaws.com/${Date.now()}-${
          newQuestion.imageFile.name
        }`;
        updatedImageUrl = await uploadToS3(
          newQuestion.imageFile,
          generatedLink
        );
      }

      // Upload images for options if MCQ
      const updatedOptions = await Promise.all(
        (newQuestion.options || []).map(async (opt) => {
          let updatedOption = { ...opt };
          if (opt.imageFile) {
            const generatedLink = `https://tutor-staffroom-files.s3.amazonaws.com/${Date.now()}-${
              opt.imageFile.name
            }`;
            const uploadedUrl = await uploadToS3(opt.imageFile, generatedLink);
            updatedOption.imageUrl = uploadedUrl;
            delete updatedOption.imageFile;
          }
          return updatedOption;
        })
      );

      const orderIndex = calculateOrderIndex(sectionForNewQuestion);
      const payload = {
        ...newQuestion,
        section: sectionForNewQuestion,
        imageUrl: updatedImageUrl,
        options: newQuestion.type === "MCQ" ? updatedOptions : undefined,
        questionPaperId,
        difficulty: newQuestion.difficulty?.toLowerCase(),
        orderIndex,
      };
      if (newQuestion.type !== "MCQ") {
        delete payload.options;
      }

      const response = await postRequest(
        `${BASE_URL_API}/question/upsert`,
        payload
      );
      if (response && response.success) {
        alert("New question added successfully!");
      } else {
        alert("Failed to add question.");
      }

      await fetchQuestionPaperDetails();
      // Close modal and reset states
      setShowAddQuestionModal(false);
      setIsEditingNewQuestion(false);
      setSectionForNewQuestion(null);
      setNewQuestion({
        type: "MCQ",
        questionText: "",
        imageUrl: "",
        marks: "",
        difficulty: "",
        options: [
          { key: "A", option: "", imageUrl: "" },
          { key: "B", option: "", imageUrl: "" },
          { key: "C", option: "", imageUrl: "" },
          { key: "D", option: "", imageUrl: "" },
        ],
      });
    } catch (error) {
      console.error("Error adding new question:", error);
      alert("Error adding question.");
    }
  };

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  return (
    <div className="flex h-screen overflow-hidden fixed inset-0">
      {/* 
        LEFT PANEL:
        - Displays sections and their questions.
        - Includes drag-and-drop and a search bar.
        - Button for creating a new section.
        - Option to select exactly 2 non-MCQ questions for optional grouping.
      */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div
          className="border-r p-4 overflow-y-auto"
          style={{ width: `${leftPanelWidth}%`, minWidth: "15%" }}
        >
          {/* Search input */}
          <div className="mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search questions..."
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Add New Section Button */}
          <div className="mb-4" style={{ width: "100%" }}>
            <button
              onClick={() => {
                setNewSectionName(getNextSectionLetter());
                setShowAddSectionModal(true);
              }}
              className="px-4 py-2 bg-black text-white font-semibold rounded hover:bg-black transition-colors"
              style={{ width: "100%" }}
            >
              Add New Section
            </button>
          </div>

          {/* Mark as optional if exactly 2 selected (non-MCQ). 
              The button appears only when exactly 2 questions have been selected. */}
          {selectedOptionalQuestions.length === 2 && (
            <div className="mb-4">
              <button
                onClick={handleMarkAsOptional}
                className="px-4 py-2 rounded shadow-md"
                style={{ backgroundColor: "black", color: "white" }}
              >
                Mark as Optional
              </button>
            </div>
          )}

          {/* Display the list of sections (filtered by searchTerm), each with a question list */}
          {visibleSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-6">
              {/* Section Heading with toggles to collapse and to add/import questions */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">Section {section.name}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSectionCollapse(sectionIndex)}
                    className="p-2 rounded flex items-center justify-center bg-black text-white"
                    title="Toggle section collapse"
                  >
                    {collapsedSections[sectionIndex] ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronUp size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => handleAddQuestionForSection(section.name)}
                    className="p-2 rounded bg-black text-white flex items-center justify-center"
                    title="Add a new question to this section"
                  >
                    <Plus size={16} className="text-white" />
                  </button>
                  <button
                    onClick={() =>
                      setShowBankModal({
                        visible: true,
                        sectionName: section.name,
                      })
                    }
                    className="p-2 rounded text-white flex items-center justify-center"
                    title="Import questions from question bank"
                    style={{ backgroundColor: "black", height: "32px" }}
                  >
                    Import questions
                  </button>
                </div>
              </div>

              {/* If the section is not collapsed, display its droppable question list */}
              {!collapsedSections[sectionIndex] && (
                <Droppable droppableId={`${sectionIndex}`}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {section.questions.map((question, index) => {
                        const isSelected = editedQuestion?.id === question.id;
                        return (
                          <Draggable
                            key={question.id}
                            draggableId={`${question.id}`}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => handleQuestionClick(question)}
                                className={`flex justify-between items-center p-3 mb-3 rounded shadow cursor-pointer transition-colors ${
                                  isSelected
                                    ? "bg-blue-50 border-l-4 border-blue-500"
                                    : "bg-white hover:bg-gray-100"
                                }`}
                              >
                                <div className="items-center gap-2">
                                  {/* Check box for optional selection (non-MCQ only) */}
                                  {question.type !== "MCQ" && (
                                    <input
                                      type="checkbox"
                                      checked={selectedOptionalQuestions.includes(
                                        question.id
                                      )}
                                      onChange={(e) =>
                                        toggleOptionalSelection(question.id, e)
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                      style={{ marginRight: 4 }}
                                    />
                                  )}
                                  {renderTruncatedTextWithMath(
                                    question.questionText,
                                    60
                                  )}
                                  {/* If the question belongs to an optional group, show a badge */}
                                  {question.optionalGroupId && (
                                    <span className="ml-2 text-xs font-bold text-green-800 bg-green-200 px-1 rounded">
                                      Optional
                                    </span>
                                  )}
                                </div>
                                {/* Delete button for the question */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteQuestion(question.id);
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash size={16} />
                                </button>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Resize handle between left and right panels */}
      <div
        onMouseDown={handleMouseDown}
        style={{ width: "5px", cursor: "col-resize" }}
        className="bg-gray-300"
      />

      {/* RIGHT PANEL: Editing a selected question */}
      <div
        className="p-4 overflow-hidden"
        style={{ width: `${100 - leftPanelWidth}%`, minWidth: "50%" }}
      >
        {/* If no question is selected, prompt user to select a question. Otherwise, show the editor. */}
        {!originalQuestion ? (
          <div className="text-gray-500">Select a question to edit</div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">Question Details</h2>
              {/* Badge for optional question */}
              {editedQuestion?.optionalGroupId && (
                <span className="bg-green-200 text-green-800 text-xs px-2 py-1 rounded">
                  Optional
                </span>
              )}
              {/* If there are unsaved changes, show a "Save" button */}
              {isModified && (
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-white rounded shadow-md"
                  style={{ backgroundColor: "black" }}
                >
                  Save
                </button>
              )}
            </div>

            {/* Main editing layout (question details on the left, math preview on the right if needed) */}
            <div className="flex flex-col md:flex-row md:items-start gap-4">
              <div className="md:w-2/3">
                {/* Display question type, difficulty, and marks as inline editable fields */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Type:</span>
                    <input
                      type="text"
                      value={editedQuestion.type || ""}
                      onChange={handleTypeChange}
                      className="w-auto bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold shadow-sm focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Difficulty:</span>
                    <input
                      type="text"
                      value={editedQuestion.difficulty || ""}
                      onChange={handleDifficultyChange}
                      className="w-auto bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold shadow-sm focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Marks:</span>
                    <input
                      type="number"
                      min="0"
                      value={editedQuestion.marks || ""}
                      onChange={handleMarksChange}
                      className="w-auto bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold shadow-sm focus:outline-none"
                    />
                  </div>
                </div>

                {/* Question text editor */}
                <div className="mt-4">
                  <label className="font-semibold mb-2 block">
                    Edit Question Text:
                  </label>
                  <textarea
                    className="w-full p-2 border rounded min-h-[100px]"
                    value={editedQuestion.questionText}
                    onChange={handleQuestionTextChange}
                  />
                </div>

                {/* Question image upload and preview */}
                <div className="mt-4 flex items-center gap-2">
                  <span className="font-semibold">Question Image:</span>
                  {editedQuestion.imageUrl || questionImageFile ? (
                    <div className="flex items-center gap-2 ml-2">
                      <img
                        src={
                          questionImageFile
                            ? URL.createObjectURL(questionImageFile)
                            : editedQuestion.imageUrl
                        }
                        alt="Question"
                        className="max-w-xs"
                        style={{ height: 64, width: 64 }}
                      />
                      {questionImageFile ? (
                        <>
                          <button
                            onClick={handleDiscardQuestionImage}
                            className="px-2 py-1 bg-gray-200 rounded text-sm"
                          >
                            Discard
                          </button>
                          <button
                            onClick={handleDeleteQuestionImage}
                            className="px-2 py-1 bg-red-200 rounded text-sm"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <>
                          <label
                            htmlFor="question-image-input"
                            className="cursor-pointer"
                          >
                            <ImageIcon
                              size={20}
                              className="text-gray-500 hover:text-gray-700"
                            />
                          </label>
                          <button
                            onClick={handleDeleteQuestionImage}
                            className="px-2 py-1 bg-red-200 rounded text-sm"
                          >
                            Remove
                          </button>
                        </>
                      )}
                      <input
                        id="question-image-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleQuestionImageChange}
                      />
                    </div>
                  ) : (
                    <label
                      htmlFor="question-image-input"
                      className="cursor-pointer"
                    >
                      <ImageIcon
                        size={20}
                        className="text-gray-500 hover:text-gray-700"
                      />
                      <input
                        id="question-image-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleQuestionImageChange}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Live preview of math, if the question text contains LaTeX placeholders */}
              {isEditingMath && (
                <div className="md:w-1/2 border-l pl-4">
                  <h3 className="font-semibold mb-2">Math Preview</h3>
                  <div className="bg-gray-50 p-3 rounded">
                    {renderTextWithMath(editedQuestion.questionText)}
                  </div>
                </div>
              )}
            </div>

            {/* MCQ Options section (only if type is MCQ) */}
            {editedQuestion.options && editedQuestion.options.length > 0 && (
              <div>
                <strong>Options</strong>
                <ul className="list-disc ml-6 mt-2 space-y-3">
                  {editedQuestion.options.map((opt, idx) => (
                    <li key={idx} className="ml-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{opt.key}.</span>
                        <textarea
                          className="w-1/2 p-2 border rounded min-h-[40px]"
                          value={opt.option || ""}
                          onChange={(e) =>
                            handleOptionChange(idx, e.target.value)
                          }
                        />
                        {/* Option image upload, display, and removal */}
                        {opt.imageUrl || opt.imageFile ? (
                          <div className="flex items-center gap-2 ml-2">
                            <img
                              src={
                                opt.imageFile
                                  ? URL.createObjectURL(opt.imageFile)
                                  : opt.imageUrl
                              }
                              alt={`Option ${opt.key}`}
                              className="max-w-[50px]"
                            />
                            {opt.imageFile ? (
                              <>
                                <button
                                  onClick={() => handleDiscardOptionImage(idx)}
                                  className="px-2 py-1 bg-gray-200 rounded text-sm"
                                  title="Discard new image"
                                >
                                  Discard
                                </button>
                                <button
                                  onClick={() => handleDeleteOptionImage(idx)}
                                  className="px-2 py-1 bg-red-200 rounded text-sm"
                                  title="Remove Option Image"
                                >
                                  <Trash size={16} />
                                </button>
                              </>
                            ) : (
                              <>
                                <label
                                  htmlFor={`option-image-${idx}`}
                                  className="cursor-pointer"
                                  title="Change Option Image"
                                >
                                  <ImageIcon
                                    size={20}
                                    className="text-gray-500 hover:text-gray-700"
                                  />
                                </label>
                                <button
                                  onClick={() => handleDeleteOptionImage(idx)}
                                  className="px-2 py-1 bg-red-200 rounded text-sm"
                                  title="Remove Option Image"
                                >
                                  <Trash size={16} />
                                </button>
                              </>
                            )}
                            <input
                              id={`option-image-${idx}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                handleOptionImageChange(idx, e.target.files[0])
                              }
                            />
                          </div>
                        ) : (
                          <>
                            <label
                              htmlFor={`option-image-${idx}`}
                              className="cursor-pointer"
                              title="Upload Option Image"
                            >
                              <ImageIcon
                                size={20}
                                className="text-gray-500 hover:text-gray-700"
                              />
                            </label>
                            <input
                              id={`option-image-${idx}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                handleOptionImageChange(idx, e.target.files[0])
                              }
                            />
                          </>
                        )}
                      </div>
                      {/* If the option text contains math ($...$), render a small preview */}
                      {opt.option && opt.option.includes("$") && (
                        <div className="ml-8 bg-gray-50 p-2 rounded text-sm text-gray-700">
                          {renderTextWithMath(opt.option)}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* -----------------------
          ADD QUESTION MODAL
      ----------------------- */}
      {showAddQuestionModal && (
        <div className={modalContainerClass}>
          <div className={modalContentClass}>
            <h3 className="text-lg font-semibold mb-4">
              {isEditingNewQuestion ? "Edit Question" : "Add New Question"}
            </h3>
            {/* Show which section the new question will belong to */}
            {sectionForNewQuestion && (
              <div className="text-gray-700 mb-2">
                <strong>Section:</strong> {sectionForNewQuestion}
              </div>
            )}

            {/* Question type dropdown */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">Question Type</label>
              <select
                value={newQuestion.type}
                onChange={(e) => handleNewQuestionChange(e, "type")}
                className="border rounded px-2 py-1 w-full"
              >
                <option value="MCQ">MCQ</option>
                <option value="Descriptive">DESCRIPTIVE</option>
              </select>
            </div>

            {/* Question text (supporting math via $ notation) */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">Question Text</label>
              <textarea
                value={newQuestion.questionText}
                onChange={(e) => handleNewQuestionChange(e, "questionText")}
                onKeyDown={(e) => handleMathKeyDown(e, "questionText")}
                className="border rounded px-2 py-1 w-full"
                placeholder="Enter question text. Use Shift + $ to add math equations."
                rows={4}
              />
              <div className="mt-2 text-sm text-gray-500">
                Preview: {renderTextWithMath(newQuestion.questionText)}
              </div>
            </div>

            {/* Question image upload */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">
                Question Image (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleQuestionImageUpload}
                className="block"
              />
              {newQuestion.imageUrl && (
                <img
                  src={newQuestion.imageUrl}
                  alt="Question preview"
                  className="mt-2 rounded w-24 h-24 border"
                />
              )}
            </div>

            {/* MCQ option fields (only if type is MCQ) */}
            {newQuestion.type === "MCQ" && (
              <div className="mb-4">
                <label className="block mb-1 font-medium">Options</label>
                {newQuestion.options.map((option, index) => (
                  <div key={option.key} className="mb-4 border p-2 rounded">
                    <label className="block text-sm font-medium">
                      Option {option.key}
                    </label>
                    <input
                      type="text"
                      value={option.option}
                      onChange={(e) =>
                        handleNewQuestionChange(e, "option", index)
                      }
                      onKeyDown={(e) => handleMathKeyDown(e, "option", index)}
                      className="border rounded px-2 py-1 w-full mb-1"
                      placeholder={`Option ${option.key} text. Use Shift + $ for math.`}
                    />
                    <div className="mt-1 text-sm text-gray-500">
                      Preview: {renderTextWithMath(option.option)}
                    </div>
                    <div className="mt-2">
                      <label className="block text-sm font-medium">
                        Option {option.key} Image (optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleOptionImageUpload(e, index)}
                        className="block"
                      />
                      {option.imageUrl && (
                        <img
                          src={option.imageUrl}
                          alt={`Option ${option.key} preview`}
                          className="mt-2 rounded w-24 h-24 border"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Marks and Difficulty inputs */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block mb-1 font-medium">Marks</label>
                <input
                  type="number"
                  min="0"
                  value={newQuestion.marks}
                  onChange={(e) => handleNewQuestionChange(e, "marks")}
                  className="border rounded px-2 py-1 w-full"
                  placeholder="e.g. 5"
                />
              </div>
              <div className="flex-1">
                <label className="block mb-1 font-medium">Difficulty</label>
                <select
                  value={newQuestion.difficulty}
                  onChange={(e) => handleNewQuestionChange(e, "difficulty")}
                  className="border rounded px-2 py-1 w-full"
                >
                  <option value="">Select Difficulty</option>
                  <option value="EASY">EASY</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HARD">HARD</option>
                </select>
              </div>
            </div>

            {/* Modal buttons */}
            <div className="flex justify-end gap-4 bg-white p-4">
              <button
                onClick={() => {
                  setShowAddQuestionModal(false);
                  setIsEditingNewQuestion(false);
                  setSectionForNewQuestion(null);
                  setNewQuestion({
                    type: "MCQ",
                    questionText: "",
                    imageUrl: "",
                    marks: "",
                    difficulty: "",
                    options: [
                      { key: "A", option: "", imageUrl: "" },
                      { key: "B", option: "", imageUrl: "" },
                      { key: "C", option: "", imageUrl: "" },
                      { key: "D", option: "", imageUrl: "" },
                    ],
                  });
                }}
                className="px-3 py-1 border border-black rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleNewQuestionSubmit}
                className="px-3 py-1 border border-black rounded bg-black text-white"
              >
                {isEditingNewQuestion ? "Update Question" : "Save Question"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        QUESTION BANK MODAL: 
        Used to import questions from a global bank. 
      */}
      {showBankModal.visible && (
        <QuestionBankModal
          onClose={() =>
            setShowBankModal({ visible: false, sectionName: null })
          }
          onImport={handleImportQuestions}
        />
      )}

      {/* -----------------------
          NEW SECTION CREATION MODAL
      ----------------------- */}
      {showAddSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white border border-gray-300 shadow-lg rounded-lg w-[400px] p-6 relative">
            <button
              onClick={() => setShowAddSectionModal(false)}
              className="absolute top-2 right-2 text-black font-bold"
            >
              X
            </button>
            <h2 className="text-lg font-semibold mb-4 text-black">
              Add New Section
            </h2>
            <div className="mb-4">
              <label className="block text-black mb-1 font-medium">
                Section Name
              </label>
              <input
                type="text"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter section name"
              />
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowAddSectionModal(false)}
                className="px-3 py-1 border border-black rounded bg-white text-black"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSection}
                className="px-3 py-1 border border-black rounded bg-black text-white"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionPaperEditPage;
