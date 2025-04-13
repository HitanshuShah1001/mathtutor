/* eslint-disable jsx-a11y/img-redundant-alt */
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Trash,
  Image as ImageIcon,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import "katex/dist/katex.min.css";
import { postRequest, getRequest } from "../utils/ApiCall";
import { uploadToS3 } from "../utils/s3utils";
import { BASE_URL_API, INVALID_TOKEN } from "../constants/constants";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { modalContainerClass, modalContentClass } from "./QuestionBank";
import { v4 as uuidv4 } from "uuid";
import { QuestionBankModal } from "./CustomQuestionPaperGeneration";
import { removeDataFromLocalStorage } from "../utils/LocalStorageOps";
import {
  renderTextWithMath,
  renderTruncatedTextWithMath,
} from "./RenderTextWithMath";
import ResizableTextarea from "./ResizableTextArea";
import { CustomLoader } from "./Loader";

/**
 * Main component for editing a question paper.
 * Allows adding sections, adding/editing questions within each section,
 * handling question images, optionally marking questions as optional, and more.
 */
const QuestionPaperEditPage = () => {
  const { docId: questionPaperId } = useParams();
  const location = useLocation();
  const { grade: paperGrade, subject: paperSubject } = location.state || {};
  // State to hold the sections of the question paper
  const [sections, setSections] = useState([]);

  const [loading, setLoading] = useState(false);
  // The original question (before editing)
  const [originalQuestion, setOriginalQuestion] = useState(null);

  // The edited question (after making changes)
  const [editedQuestion, setEditedQuestion] = useState(null);

  // Local state for newly selected question images (not yet saved)
  const [questionImageUrls, setQuestionImageUrls] = useState([]);

  // Search term for filtering questions in the left panel
  const [searchTerm, setSearchTerm] = useState("");

  // Controls visibility of the "Add Question" modal
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);

  // Indicates if we're editing (rather than creating) a new question
  const [isEditingNewQuestion, setIsEditingNewQuestion] = useState(false);

  // Stores the section name for which we are adding a new question
  const [sectionForNewQuestion, setSectionForNewQuestion] = useState(null);

  // Controls visibility of the question bank modal
  const [showBankModal, setShowBankModal] = useState({
    visible: false,
    sectionName: null,
  });

  // Object that holds the data for a brand-new question to be added
  const [newQuestion, setNewQuestion] = useState({
    type: "mcq",
    questionText: "",
    imageUrls: [],
    marks: "",
    difficulty: "medium",
    options: [
      { key: "A", option: "", imageUrl: "" },
      { key: "B", option: "", imageUrl: "" },
      { key: "C", option: "", imageUrl: "" },
      { key: "D", option: "", imageUrl: "" },
    ],
  });

  // Controls visibility of the "Add Section" modal
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [grade, setGrade] = useState(paperGrade);
  const [subject, setSubject] = useState(paperSubject);
  // Stores the name of the new section to be added
  const [newSectionName, setNewSectionName] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [modalDocument, setModalDocument] = useState(null);

  // Stores question IDs which are selected to be marked as optional
  const [selectedOptionalQuestions, setSelectedOptionalQuestions] = useState(
    []
  );

  // Keeps track of which sections are currently collapsed in the left panel
  const [collapsedSections, setCollapsedSections] = useState({});

  // Manages the left panel's width for resizing
  const [leftPanelWidth, setLeftPanelWidth] = useState(33);
  const [isResizing, setIsResizing] = useState(false);

  const navigate = useNavigate();

  /**
   * Helper function to group questions by their optionalGroupId.
   * Questions without an optionalGroupId each become their own group.
   */
  const groupQuestions = (questions) => {
    const groups = [];
    const seen = new Set();

    questions.forEach((q) => {
      // If question has an optionalGroupId, group them
      if (q.optionalGroupId) {
        if (!seen.has(q.optionalGroupId)) {
          const grouped = questions.filter(
            (x) => x.optionalGroupId === q.optionalGroupId
          );
          groups.push({ groupId: q.optionalGroupId, questions: grouped });
          seen.add(q.optionalGroupId);
        }
      } else {
        // If no optionalGroupId, it's alone in its group
        groups.push({ groupId: null, questions: [q] });
      }
    });

    return groups;
  };

  /**
   * Returns the next alphabet letter for naming a new section.
   * If no sections exist, returns "A".
   * If there's at least one, finds the highest letter and returns the next letter.
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
    if (nextCharCode > "Z".charCodeAt(0)) return "A";
    return String.fromCharCode(nextCharCode);
  };

  /**
   * Handles creating and adding a new section to the local state.
   * This doesn't persist to the server directly in this function.
   */
  const handleAddSection = () => {
    if (!newSectionName.trim()) {
      alert("Please enter a valid section name.");
      return;
    }
    const newSec = { name: newSectionName.trim(), questions: [] };
    const updated = [...sections, newSec];
    const sorted = sortSectionsAlphabetically(updated);
    setSections(sorted);
    setShowAddSectionModal(false);
    setNewSectionName("");
  };

  const sortSectionsAlphabetically = (sections) => {
    return [...sections].sort((a, b) => a.name.localeCompare(b.name));
  };

  /**
   * Toggles the collapse/expand state of a given section.
   */
  const toggleSectionCollapse = (sectionIndex) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionIndex]: !prev[sectionIndex],
    }));
  };

  /**
   * Handles the mousemove event for resizing the left panel.
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
   * Initiates resizing when user mouses down on the resize handle.
   */
  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const handleAddOptionNew = () => {
    setNewQuestion((prev) => {
      const newOptions = [...prev.options];
      const newKey = String.fromCharCode(65 + newOptions.length);
      newOptions.push({ key: newKey, option: "", imageUrl: "" });
      return { ...prev, options: newOptions };
    });
  };

  const handleRemoveOptionNew = (index) => {
    setNewQuestion((prev) => {
      let newOptions = [...prev.options];
      if (newOptions.length > 2) {
        newOptions.splice(index, 1);
        newOptions = newOptions.map((opt, idx) => ({
          ...opt,
          key: String.fromCharCode(65 + idx),
        }));
        return { ...prev, options: newOptions };
      }
      return prev;
    });
  };

  const handleAddOptionEdit = () => {
    setEditedQuestion((prev) => {
      const newOptions = [...(prev.options || [])];
      const newKey = String.fromCharCode(65 + newOptions.length);
      newOptions.push({ key: newKey, option: "", imageUrl: "" });
      return { ...prev, options: newOptions };
    });
  };

  const handleRemoveOptionEdit = (index) => {
    setEditedQuestion((prev) => {
      let newOptions = [...(prev.options || [])];
      if (newOptions.length > 2) {
        newOptions.splice(index, 1);
        newOptions = newOptions.map((opt, idx) => ({
          ...opt,
          key: String.fromCharCode(65 + idx),
        }));
        return { ...prev, options: newOptions };
      }
      return prev;
    });
  };

  /**
   * Fetches the details of the question paper (sections, questions) from the server.
   */
  const fetchQuestionPaperDetails = async () => {
    try {
      const response = await getRequest(
        `${BASE_URL_API}/questionPaper/${questionPaperId}`
      );
      if (response?.success) {
        const sortedSections = sortSectionsAlphabetically(
          response.questionPaper.sections || []
        );
        setSections(sortedSections);
      } else {
        if (response.message === INVALID_TOKEN) {
          removeDataFromLocalStorage();
          navigate("/login");
          return;
        }
        console.error("Failed to fetch question paper details:", response);
      }
    } catch (error) {
      console.error("Error fetching question paper details:", error);
    }
  };

  // Fetch question paper details on component mount
  useEffect(() => {
    fetchQuestionPaperDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * When a question is clicked from the left panel, set it as the original and
   * initialize the editedQuestion with a deep copy.
   */
  const handleQuestionClick = (question) => {
    setOriginalQuestion(question);
    setEditedQuestion(JSON.parse(JSON.stringify(question)));
    setQuestionImageUrls([]);
  };

  /**
   * Determines if the current edited question has unsaved changes.
   */
  const isModified =
    editedQuestion && originalQuestion
      ? JSON.stringify(editedQuestion) !== JSON.stringify(originalQuestion) ||
        questionImageUrls.length > 0
      : false;

  /**
   * Filters the sections by the search term so that only matching questions appear.
   */
  const getFilteredSections = () => {
    const lowerSearch = searchTerm?.toLowerCase();
    const filtered = sections.map((section) => {
      const filteredQuestions = section.questions.filter((q) =>
        q.questionText?.toLowerCase().includes(lowerSearch)
      );
      return { ...section, questions: filteredQuestions };
    });
    return filtered;
  };

  const visibleSections = getFilteredSections();

  // For showing a live math preview on the right side
  const isEditingMath = editedQuestion?.questionText?.includes("$");

  /**
   * Toggles a question's inclusion in the optional selection list (only 2 at a time allowed).
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
   * Marks the selected questions as optional by assigning them the same optionalGroupId.
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

  /**
   * Unmarks the selected questions from optional by removing their optionalGroupId.
   */
  const handleUnmarkAsOptional = async () => {
    // Only meaningful if exactly 2 questions share the same optionalGroupId
    if (selectedOptionalQuestions.length !== 2) return;
    const updatedSections = sections.map((section) => {
      const updatedQuestions = section.questions.map((q) => {
        if (selectedOptionalQuestions.includes(q.id)) {
          return { ...q, optionalGroupId: null };
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
      alert("Optional status removed successfully!");
      setSelectedOptionalQuestions([]);
      await fetchQuestionPaperDetails();
    } else {
      alert("Failed to remove optional status.");
    }
  };

  /**
   * Updates the question text in the editedQuestion state.
   */
  const handleQuestionTextChange = (content) => {
    setEditedQuestion((prev) => ({
      ...prev,
      questionText: content.target.value,
    }));
  };

  /**
   * API to generate HTML link for question paper preview
   */
  const getHtmlLink = async (questionPaperId) => {
    const url = `${BASE_URL_API}/questionpaper/generateHtml`;
    const body = { questionPaperId };
    try {
      const result = await postRequest(url, body);
      return result?.questionPaper; // e.g., a URL to the generated HTML/PDF
    } catch (error) {
      console.error("Error generating HTML:", error);
    }
  };

  const handlePreviewClick = async () => {
    const link = await getHtmlLink(questionPaperId);
    if (link) {
      // link is presumably a URL to the generated HTML (or PDF)
      setModalDocument(link?.questionPaperLink);
      setModalVisible(true);
    } else {
      alert("Failed to generate preview");
    }
  };

  /**
   * Changes the question type (mcq/Descriptive) in the editedQuestion via a dropdown.
   */
  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setEditedQuestion((prev) => {
      // If changing from a non-mcq type to mcq, initialize options to 4 default options.
      if (
        prev.type !== "mcq" &&
        newType === "mcq" &&
        (editedQuestion?.options?.length == 0 || !editedQuestion.options)
      ) {
        return {
          ...prev,
          type: newType,
          options: [
            { key: "A", option: "", imageUrl: "" },
            { key: "B", option: "", imageUrl: "" },
            { key: "C", option: "", imageUrl: "" },
            { key: "D", option: "", imageUrl: "" },
          ],
        };
      }
      // For other cases, simply update the type.
      return {
        ...prev,
        type: newType,
      };
    });
  };

  /**
   * Imports questions from the question bank into the specified section.
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
      setLoading(true);
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
        setShowBankModal({ visible: false, sectionName: null });
      } else {
        alert(resp?.message || "Failed to import questions");
      }
    } catch (err) {
      console.error("Error importing questions:", err);
      alert("Error importing questions.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Updates the difficulty level of the edited question.
   */
  const handleDifficultyChange = (e) => {
    const newDiff = e.target.value;
    setEditedQuestion((prev) => ({
      ...prev,
      difficulty: newDiff,
    }));
  };

  /**
   * Updates the marks for the edited question.
   */
  const handleMarksChange = (e) => {
    const newMarks = e.target.value;
    setEditedQuestion((prev) => ({
      ...prev,
      marks: newMarks,
    }));
  };

  /**
   * Updates the text of one of the mcq options for the edited question.
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

  /**
   * Adds newly selected files to the local questionImageUrls array.
   */
  const handleQuestionImageChange = (e) => {
    const files = Array.from(e.target.files);
    setQuestionImageUrls((prev) => [...prev, ...files]);
  };

  /**
   * Removes an existing image from the edited question.
   */
  const handleDeleteQuestionImage = (index) => {
    setEditedQuestion((prev) => {
      const updatedImageUrls = [...prev.imageUrls];
      updatedImageUrls.splice(index, 1);
      return { ...prev, imageUrls: updatedImageUrls };
    });
  };

  /**
   * Discards a newly added (but not yet saved) image from local state.
   */
  const handleDiscardQuestionImage = (index) => {
    setQuestionImageUrls((prev) => {
      const updatedFiles = [...prev];
      updatedFiles.splice(index, 1);
      return updatedFiles;
    });
  };

  /**
   * Handles the event of uploading a new image for one of the mcq options in the edited question.
   */
  const handleOptionImageChange = (index, file) => {
    setEditedQuestion((prev) => {
      const updatedOptions = [...(prev.options || [])];
      updatedOptions[index] = {
        ...updatedOptions[index],
        imageUrl: file,
      };
      return updatedOptions.length > 0
        ? { ...prev, options: updatedOptions }
        : prev;
    });
  };

  /**
   * Removes (existing) or discards (new) an option image from the edited question.
   */
  const handleDeleteOptionImage = (index) => {
    setEditedQuestion((prev) => {
      const updatedOptions = [...(prev.options || [])];
      delete updatedOptions[index].imageUrl;
      return { ...prev, options: updatedOptions };
    });
  };

  /**
   * Removes (existing) or discards (new) an option image from the edited question.
   * Typically used for newly uploaded images.
   */
  const handleDiscardOptionImage = (index) => {
    setEditedQuestion((prev) => {
      const updatedOptions = [...(prev.options || [])];
      if (updatedOptions[index].imageUrl) {
        delete updatedOptions[index].imageUrl;
      }
      return { ...prev, options: updatedOptions };
    });
  };

  /**
   * Saves the edited question to the database (upsert). It uploads newly added images first.
   */
  const handleSave = async () => {
    try {
      setLoading(true);
      // Upload newly selected question-level images
      let updatedImageUrls = editedQuestion.imageUrls || [];
      if (questionImageUrls.length > 0) {
        const uploadedUrls = await Promise.all(
          questionImageUrls.map(async (file) => {
            const generatedLink = `https://tutor-staffroom-files.s3.amazonaws.com/${Date.now()}-${
              file.name
            }`;
            return await uploadToS3(file, generatedLink);
          })
        );
        updatedImageUrls = [...updatedImageUrls, ...uploadedUrls];
      }

      // Upload newly selected option images
      const updatedOptions = await Promise.all(
        (editedQuestion.options || []).map(async (opt) => {
          let updatedOption = { ...opt };
          if (opt.imageUrl && typeof opt.imageUrl !== "string") {
            const generatedLink = `https://tutor-staffroom-files.s3.amazonaws.com/${Date.now()}-${
              opt.imageUrl.name
            }`;
            const uploadedUrl = await uploadToS3(opt.imageUrl, generatedLink);
            updatedOption.imageUrl = uploadedUrl;
          }
          return updatedOption;
        })
      );

      const updatedQuestion = {
        ...editedQuestion,
        imageUrls: updatedImageUrls,
        options: updatedOptions,
      };

      let payload = {
        ...updatedQuestion,
        difficulty: updatedQuestion.difficulty?.toLowerCase() ?? "medium",
        questionPaperId,
        grade,
        subject,
      };
      if (originalQuestion) {
        payload.id = updatedQuestion.id;
      }
      if (updatedQuestion.type !== "mcq") {
        delete payload.options;
      }

      const response = await postRequest(
        `${BASE_URL_API}/question/upsert`,
        payload
      );
      if (response && response.success) {
        alert("Question edited successfully!");
      } else {
        alert("Failed to edit question.");
      }

      await fetchQuestionPaperDetails();
      setOriginalQuestion(null);
      setEditedQuestion(null);
      setQuestionImageUrls([]);
    } catch (error) {
      console.error("Error upserting question:", error);
      alert("Error upserting question.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deletes a question from the server and updates the local state.
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

  /**
   * Handles the reorder of questions within the same section via drag-and-drop.
   */
  const handleDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;
    console.log(sections, "sections");
    console.log(source, destination);
    const sourceSectionIndex = parseInt(source.droppableId, 10);
    const destSectionIndex = parseInt(destination.droppableId, 10);

    const sourceSection = sections[sourceSectionIndex];
    const destSection = sections[destSectionIndex];

    // Clone the questions array
    const updatedSections = [...sections];

    if (sourceSectionIndex === destSectionIndex) {
      // Same section reorder
      const updatedQuestions = [...sourceSection.questions];
      const [movedQuestion] = updatedQuestions.splice(source.index, 1);
      updatedQuestions.splice(destination.index, 0, movedQuestion);

      // Update orderIndex
      const reordered = updatedQuestions.map((q, i) => ({
        ...q,
        orderIndex: i + 1,
      }));

      updatedSections[sourceSectionIndex] = {
        ...sourceSection,
        questions: reordered,
      };
    } else {
      // Cross-section move
      const sourceQuestions = [...sourceSection.questions];
      const [movedQuestion] = sourceQuestions.splice(source.index, 1);

      const destQuestions = [...destSection.questions];
      destQuestions.splice(destination.index, 0, {
        ...movedQuestion,
        section: destSection.name,
      });

      updatedSections[sourceSectionIndex] = {
        ...sourceSection,
        questions: sourceQuestions.map((q, i) => ({ ...q, orderIndex: i + 1 })),
      };
      updatedSections[destSectionIndex] = {
        ...destSection,
        questions: destQuestions.map((q, i) => ({
          ...q,
          section: destSection.name,
          orderIndex: i + 1,
        })),
      };
    }
    console.log(updatedSections);
    setSections(updatedSections);

    const payload = {
      id: questionPaperId,
      sections: updatedSections,
    };

    const response = await postRequest(
      `${BASE_URL_API}/questionPaper/update`,
      payload
    );
    if (!response?.success) {
      console.error("Failed to update question order:", response);
    } else {
      await fetchQuestionPaperDetails();
    }
  };

  /**
   * Prepares to add a new question to a specified section.
   */
  const handleAddQuestionForSection = (sectionName) => {
    setSectionForNewQuestion(sectionName);
    setShowAddQuestionModal(true);
    setIsEditingNewQuestion(false);
    setNewQuestion({
      type: "mcq",
      questionText: "",
      imageUrls: [],
      marks: "",
      difficulty: "medium",
      options: [
        { key: "A", option: "", imageUrl: "" },
        { key: "B", option: "", imageUrl: "" },
        { key: "C", option: "", imageUrl: "" },
        { key: "D", option: "", imageUrl: "" },
      ],
    });
  };

  /**
   * Checks if the new question form is valid (all mandatory fields filled).
   */
  const isNewQuestionValid = () => {
    const { type, questionText, marks, difficulty, options } = newQuestion;
    if (!type) return false;
    if (!questionText.trim()) return false;
    if (!marks || Number(marks) < 0) return false;
    if (!difficulty) return false;

    // If it's mcq, all option texts must be non-empty
    if (type === "mcq") {
      for (let opt of options) {
        if (!opt.option.trim()) return false;
      }
    }
    return true;
  };

  /**
   * Handles updates to the new question form fields (including mcq option text).
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
   * Placeholder for keydown events that handle math input in the new question form.
   */
  const handleMathKeyDown = (e, field, index) => {
    // Implementation detail: optional custom logic
  };

  /**
   * Handles new question images. Stores the actual File objects in newQuestion.imageUrls.
   */
  const handleQuestionImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setNewQuestion((prev) => ({
      ...prev,
      imageUrls: [...prev.imageUrls, ...files],
    }));
  };

  /**
   * Handles image upload for an mcq option in the new question form.
   * Saves the File object in the option's imageUrl.
   */
  const handleOptionImageUpload = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewQuestion((prev) => {
      const newOptions = [...prev.options];
      newOptions[index] = {
        ...newOptions[index],
        imageUrl: file,
      };
      return { ...prev, options: newOptions };
    });
  };

  /**
   * Determines the correct order index for a new question in a given section.
   */
  const calculateOrderIndex = (sectionName) => {
    const foundSection = sections.find((sec) => sec.name === sectionName);
    if (!foundSection) return 1;
    return foundSection.questions.length + 1;
  };

  /**
   * Submits the new question form data to the server.
   * Uploads images first, then calls the server with the final URLs.
   */
  const handleNewQuestionSubmit = async () => {
    // Prevent submission if form is invalid
    if (!isNewQuestionValid()) {
      alert("Please fill out all mandatory fields before saving.");
      return;
    }

    try {
      setLoading(true);
      // Upload question-level images
      let uploadedImageUrls = [];
      if (newQuestion.imageUrls?.length > 0) {
        const uploadedUrls = await Promise.all(
          newQuestion.imageUrls.map(async (file) => {
            const generatedLink = `https://tutor-staffroom-files.s3.amazonaws.com/${Date.now()}-${
              file.name
            }`;
            return await uploadToS3(file, generatedLink);
          })
        );
        uploadedImageUrls = uploadedUrls;
      }

      // Upload option images if any
      const updatedOptions = await Promise.all(
        (newQuestion.options || []).map(async (opt) => {
          let updatedOption = { ...opt };
          if (opt.imageUrl && typeof opt.imageUrl !== "string") {
            const generatedLink = `https://tutor-staffroom-files.s3.amazonaws.com/${Date.now()}-${
              opt.imageUrl.name
            }`;
            const uploadedUrl = await uploadToS3(opt.imageUrl, generatedLink);
            updatedOption.imageUrl = uploadedUrl;
          }
          return updatedOption;
        })
      );

      const orderIndex = calculateOrderIndex(sectionForNewQuestion);
      const payload = {
        ...newQuestion,
        section: sectionForNewQuestion,
        imageUrls: uploadedImageUrls,
        options: newQuestion.type === "mcq" ? updatedOptions : undefined,
        questionPaperId,
        difficulty: "medium",
        orderIndex,
        subject,
        grade,
      };
      if (newQuestion.type !== "mcq") {
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
      setShowAddQuestionModal(false);
      setIsEditingNewQuestion(false);
      setSectionForNewQuestion(null);
      setNewQuestion({
        type: "mcq",
        questionText: "",
        imageUrls: [],
        marks: "",
        difficulty: "medium",
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
    } finally {
      setLoading(false);
    }
  };

  // Utility to retrieve two selected questions' data
  const getSelectedQuestions = () => {
    const allQuestions = sections.flatMap((section) => section.questions);
    return selectedOptionalQuestions.map((id) =>
      allQuestions.find((q) => q.id === id)
    );
  };

  // Determine if the two selected questions share the same non-null optionalGroupId
  const twoSelectedHaveSameGroupId = () => {
    if (selectedOptionalQuestions.length !== 2) return false;
    const [q1, q2] = getSelectedQuestions();
    if (!q1 || !q2) return false;
    if (!q1.optionalGroupId || !q2.optionalGroupId) return false;
    return q1.optionalGroupId === q2.optionalGroupId;
  };

  return (
    <div className="flex h-screen overflow-hidden fixed inset-0">
      {/* Left panel with sections and questions */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div
          className={`border-r p-4 overflow-y-auto ${loading ? "blur-sm" : ""}`}
          style={{ width: `${leftPanelWidth}%`, minWidth: "15%" }}
        >
          {/* --Search Box-- */}
          <div className="mb-4 flex flex-col gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search questions..."
              className="w-full p-2 border rounded"
            />
            <button
              onClick={handlePreviewClick}
              className="px-4 py-2 bg-black text-white font-semibold rounded hover:bg-gray-800 transition-colors"
            >
              Preview
            </button>
          </div>

          {/* --Add New Section Button-- */}
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

          {/* 
            --Mark/Unmark as Optional Button (only if exactly 2 selected)--
            If both selected questions share a non-null optionalGroupId, 
            show "Unmark as Optional" button; otherwise, show "Mark as Optional".
          */}
          {selectedOptionalQuestions.length === 2 && (
            <div className="mb-4">
              {twoSelectedHaveSameGroupId() ? (
                <button
                  onClick={handleUnmarkAsOptional}
                  className="px-4 py-2 rounded shadow-md"
                  style={{ backgroundColor: "black", color: "white" }}
                >
                  Unmark as Optional
                </button>
              ) : (
                <button
                  onClick={handleMarkAsOptional}
                  className="px-4 py-2 rounded shadow-md"
                  style={{ backgroundColor: "black", color: "white" }}
                >
                  Mark as Optional
                </button>
              )}
            </div>
          )}

          {/* --Sections & Questions-- */}
          {visibleSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-6">
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

              {/* Collapsible Section */}
              {!collapsedSections[sectionIndex] && (
                <Droppable droppableId={`${sectionIndex}`}>
                  {(provided) => {
                    // Group questions by optionalGroupId
                    const groupedQuestions = groupQuestions(section.questions);
                    return (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                          minHeight:
                            groupedQuestions.length === 0 ? "50px" : "auto",
                        }}
                      >
                        {groupedQuestions.map((group, groupIndex) => {
                          // If a group has more than one question, show them together with "OR"
                          if (group.questions.length > 1) {
                            return (
                              <Draggable
                                key={group.groupId}
                                draggableId={group.groupId}
                                index={groupIndex}
                              >
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="mb-3"
                                  >
                                    <div className="flex flex-col items-center">
                                      {group.questions.map((q, idx) => (
                                        <React.Fragment key={q.id}>
                                          <div
                                            className="flex items-center gap-2 p-3 rounded shadow cursor-pointer transition-colors border-l-4 border-blue-500 w-full"
                                            onClick={() =>
                                              handleQuestionClick(q)
                                            }
                                          >
                                            <span
                                              className="font-semibold"
                                              style={{ marginRight: 5 }}
                                            >
                                              {groupIndex + 1}.
                                            </span>
                                            {q.type !== "mcq" && (
                                              <input
                                                type="checkbox"
                                                checked={selectedOptionalQuestions.includes(
                                                  q.id
                                                )}
                                                onClick={(e) =>
                                                  e.stopPropagation()
                                                }
                                                onChange={(e) =>
                                                  toggleOptionalSelection(
                                                    q.id,
                                                    e
                                                  )
                                                }
                                              />
                                            )}
                                            {renderTruncatedTextWithMath(
                                              q.questionText,
                                              100
                                            )}
                                          </div>
                                          {/* Insert an OR between each question in the optional group */}
                                          {idx < group.questions.length - 1 && (
                                            <div className="w-full text-center text-xs font-semibold text-gray-500 my-1">
                                              OR
                                            </div>
                                          )}
                                        </React.Fragment>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          } else {
                            // Single (non-optional) or only one question in that optional group
                            const q = group.questions[0];
                            return (
                              <Draggable
                                key={q.id}
                                draggableId={`${q.id}`}
                                index={groupIndex}
                              >
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => handleQuestionClick(q)}
                                    className="flex justify-between items-center p-3 mb-3 rounded shadow cursor-pointer transition-colors bg-white hover:bg-gray-100"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="font-semibold"
                                        style={{ marginRight: 5 }}
                                      >
                                        {groupIndex + 1}.
                                      </span>
                                      {/* Optional selection for non-MCQs, example usage */}
                                      {q.type !== "mcq" && (
                                        <input
                                          type="checkbox"
                                          checked={selectedOptionalQuestions.includes(
                                            q.id
                                          )}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) =>
                                            toggleOptionalSelection(q.id, e)
                                          }
                                        />
                                      )}
                                      {renderTruncatedTextWithMath(
                                        q.questionText,
                                        100
                                      )}
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteQuestion(q.id);
                                      }}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <Trash size={16} />
                                    </button>
                                  </div>
                                )}
                              </Draggable>
                            );
                          }
                        })}
                        {provided.placeholder}
                      </div>
                    );
                  }}
                </Droppable>
              )}
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Resizable divider */}
      <div
        onMouseDown={handleMouseDown}
        style={{ width: "5px", cursor: "col-resize" }}
        className="bg-gray-300"
      />

      {/* Right panel for question editing */}
      <div
        className="p-4 overflow-y-auto"
        style={{ width: `${100 - leftPanelWidth}%`, minWidth: "50%" }}
      >
        {!originalQuestion ? (
          <div className="text-gray-500">Select a question to edit</div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">Question Details</h2>

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

            {/* Question Type, Difficulty, Marks */}
            <div className="flex flex-wrap gap-2 mt-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Type:</span>
                <select
                  value={editedQuestion.type.toLowerCase() || ""}
                  onChange={handleTypeChange}
                  className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold shadow-sm focus:outline-none"
                >
                  <option value="mcq">mcq</option>
                  <option value="descriptive">descriptive</option>
                </select>
              </div>

              {/* <div className="flex items-center gap-2">
                <span className="font-semibold">Difficulty:</span>
                <select
                  value={editedQuestion.difficulty || ""}
                  onChange={handleDifficultyChange}
                  className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold shadow-sm focus:outline-none"
                >
                  <option value="easy">easy</option>
                  <option value="medium">medium</option>
                  <option value="hard">hard</option>
                </select>
              </div> */}
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

            {/* Question Text */}
            <div className="mt-4">
              <label className="font-semibold mb-2 block">
                Edit Question Text:
              </label>

              <ResizableTextarea
                className="w-full p-2 border rounded"
                value={editedQuestion.questionText}
                onChange={(e) => handleQuestionTextChange(e)}
                style={{ whiteSpace: "pre-wrap" }}
              />
            </div>

            {/* Images */}
            <div className="mt-4">
              <label className="font-semibold mb-2 block">
                Question Images:
              </label>
              <div className="flex flex-wrap gap-2 mt-3">
                {editedQuestion.imageUrls?.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Question ${index + 1}`}
                      className="object-contain rounded border h-24"
                    />
                    <button
                      onClick={() => handleDeleteQuestionImage(index)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                ))}
                {questionImageUrls.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`New Image ${index + 1}`}
                      className="h-24 object-contain rounded border"
                    />
                    <button
                      onClick={() => handleDiscardQuestionImage(index)}
                      className="absolute top-0 right-0 bg-gray-500 text-white rounded-full p-1"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                ))}
                <label
                  htmlFor="question-image-input"
                  className="cursor-pointer flex items-center justify-center w-24 h-24 border-2 border-dashed rounded"
                >
                  <Plus size={24} className="text-gray-500" />
                  <input
                    id="question-image-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleQuestionImageChange}
                    multiple
                  />
                </label>
              </div>
            </div>

            {/* Math Preview (if question includes $) */}
            {isEditingMath && (
              <div className="border-l pl-4 mt-4">
                <h3 className="font-semibold mb-2">Math Preview</h3>
                <div className="bg-gray-50 p-3 rounded">
                  {renderTextWithMath(editedQuestion.questionText)}
                </div>
              </div>
            )}

            {/* mcq Options */}
            {editedQuestion.options && editedQuestion.options.length > 0 && (
              <div>
                <strong>Options</strong>
                <ul className="list-disc ml-6 mt-2 space-y-3">
                  {editedQuestion.options.map((opt, idx) => (
                    <li key={idx} className="ml-3 relative">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{opt.key}.</span>
                        <textarea
                          className="w-1/2 p-2 border rounded min-h-[40px]"
                          value={opt.option || ""}
                          onChange={(e) =>
                            handleOptionChange(idx, e.target.value)
                          }
                        />
                        {opt.imageUrl ? (
                          <div className="flex items-center gap-2 ml-2">
                            <img
                              src={
                                typeof opt.imageUrl === "string"
                                  ? opt.imageUrl
                                  : URL.createObjectURL(opt.imageUrl)
                              }
                              alt={`Option ${opt.key}`}
                              className="h-24"
                            />
                            {typeof opt.imageUrl === "string" ? (
                              <button
                                onClick={() => handleDeleteOptionImage(idx)}
                                className="px-2 py-1 bg-red-200 rounded text-sm"
                                title="Remove Option Image"
                              >
                                <Trash size={16} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDiscardOptionImage(idx)}
                                className="px-2 py-1 bg-gray-200 rounded text-sm"
                                title="Discard new image"
                              >
                                Discard
                              </button>
                            )}
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
                            {editedQuestion.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOptionEdit(idx)}
                                className="ml-4"
                              >
                                Delete
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      {opt.option && opt.option.includes("$") && (
                        <div className="ml-8 bg-gray-50 p-2 rounded text-sm text-gray-700">
                          {renderTextWithMath(opt.option)}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={handleAddOptionEdit}
                  className="mt-2 px-3 py-1 border border-black rounded bg-black text-white"
                >
                  Add Option
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Question Modal */}
      {showAddQuestionModal && (
        <div className={modalContainerClass}>
          <div className={modalContentClass}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {isEditingNewQuestion ? "Edit Question" : "Add New Question"}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAddQuestionModal(false);
                    setIsEditingNewQuestion(false);
                    setSectionForNewQuestion(null);
                    // Reset newQuestion to defaults
                    setNewQuestion({
                      type: "mcq",
                      questionText: "",
                      imageUrls: [],
                      marks: "",
                      difficulty: "medium",
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
                  disabled={!isNewQuestionValid()} // disable if form invalid
                >
                  {isEditingNewQuestion ? "Update Question" : "Save Question"}
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-2">
              * All fields (except images) are mandatory.
            </p>

            {sectionForNewQuestion && (
              <div className="text-gray-700 mb-2">
                <strong>Section:</strong> {sectionForNewQuestion}
              </div>
            )}

            <div className="mb-4">
              <label className="block mb-1 font-medium">
                Question Type <span className="text-red-500">*</span>
              </label>
              <select
                value={newQuestion.type}
                onChange={(e) => handleNewQuestionChange(e, "type")}
                className="border rounded px-2 py-1 w-full"
              >
                <option value="mcq">mcq</option>
                <option value="descriptive">descriptive</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-medium">
                Question Text <span className="text-red-500">*</span>
              </label>
              <ResizableTextarea
                value={newQuestion.questionText}
                onChange={(e) => handleNewQuestionChange(e, "questionText")}
                className="border rounded px-2 py-1 w-full"
                placeholder="Enter question text. Use Shift + $ to add math equations."
              />
              <div className="mt-2 text-sm text-gray-500">
                Preview: {renderTextWithMath(newQuestion.questionText)}
              </div>
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-medium">
                Question Images (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {newQuestion.imageUrls?.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Question ${index + 1}`}
                      className="w-24 h-24 object-contain rounded border"
                    />
                    <button
                      onClick={() => {
                        setNewQuestion((prev) => {
                          const updated = [...prev.imageUrls];
                          updated.splice(index, 1);
                          return { ...prev, imageUrls: updated };
                        });
                      }}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                ))}
                <label
                  htmlFor="new-question-image-input"
                  className="cursor-pointer flex items-center justify-center w-24 h-24 border-2 border-dashed rounded"
                >
                  <Plus size={24} className="text-gray-500" />
                  <input
                    id="new-question-image-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleQuestionImageUpload}
                    multiple
                  />
                </label>
              </div>
            </div>

            {newQuestion.type === "mcq" && (
              <div className="mb-4">
                <label className="block mb-1 font-medium">
                  Options <span className="text-red-500">*</span>
                </label>
                {newQuestion.options.map((option, index) => (
                  <div
                    key={option.key}
                    className="mb-4 border p-2 rounded relative"
                  >
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
                      placeholder={`Option ${option.key} text (mandatory). Use Shift + $ for math.`}
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
                          src={URL.createObjectURL(option.imageUrl)}
                          alt={`Option ${option.key} preview`}
                          className="mt-2 rounded w-24 h-24 border"
                        />
                      )}
                    </div>
                    {newQuestion.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOptionNew(index)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddOptionNew}
                  className="px-3 py-1 border border-black rounded bg-black text-white"
                >
                  Add Option
                </button>
              </div>
            )}

            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block mb-1 font-medium">
                  Marks <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={newQuestion.marks}
                  onChange={(e) => handleNewQuestionChange(e, "marks")}
                  className="border rounded px-2 py-1 w-full"
                  placeholder="e.g. 5"
                />
              </div>
              {/* <div className="flex-1">
                <label className="block mb-1 font-medium">
                  Difficulty <span className="text-red-500">*</span>
                </label>
                <select
                  value={newQuestion.difficulty}
                  onChange={(e) => handleNewQuestionChange(e, "difficulty")}
                  className="border rounded px-2 py-1 w-full"
                >
                  <option value="">Select Difficulty</option>
                  <option value="easy">easy</option>
                  <option value="medium">medium</option>
                  <option value="hard">hard</option>
                </select>
              </div> */}
            </div>
            {/* The Save/Cancel buttons are at the top for this modal */}
          </div>
        </div>
      )}

      {/* Question Bank Modal */}
      {showBankModal.visible && (
        <QuestionBankModal
          onClose={() =>
            setShowBankModal({ visible: false, sectionName: null })
          }
          onImport={handleImportQuestions}
        />
      )}

      {/* Add Section Modal */}
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
      {modalVisible && modalDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white w-11/12 h-[90vh] rounded-lg shadow-xl relative flex flex-col">
            <button
              onClick={() => setModalVisible(false)}
              className="absolute top-4 right-4 px-3 py-1 border border-black rounded bg-black text-white"
            >
              Close
            </button>
            <div className="p-4 flex-1 overflow-auto">
              {/* 
                Display the returned link in an iframe.
                The user can only view and close. 
                (No download actions, no extra buttons)
              */}
              <iframe
                src={modalDocument}
                className="w-full h-full"
                title="Question Paper Preview"
              />
            </div>
          </div>
        </div>
      )}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-white bg-opacity-30">
          <CustomLoader />
        </div>
      )}
    </div>
  );
};

export default QuestionPaperEditPage;
