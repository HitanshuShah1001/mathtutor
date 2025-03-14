/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Trash, Image as ImageIcon, Plus } from "lucide-react";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import { postRequest, getRequest } from "../utils/ApiCall";
import { uploadToS3 } from "../utils/s3utils";
import { BASE_URL_API } from "../constants/constants";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { v4 as uuidv4 } from "uuid";

// EXAMPLE: a placeholder QuestionBankModal – you can swap in your real component
// The user can select multiple questions, then calls onImport( selectedQuestionIds ).
function QuestionBankModal({ onClose, onImport }) {
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  // For demonstration: we mock some question bank data
  const questionBankData = [
    { id: 8001, questionText: "Imported Q1 from question bank" },
    { id: 8002, questionText: "Imported Q2 from question bank" },
    { id: 8003, questionText: "Imported Q3 from question bank" },
  ];

  const toggleSelect = (id) => {
    setSelectedQuestions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white border border-gray-300 shadow-lg rounded-lg w-[400px] p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-black font-bold"
        >
          X
        </button>
        <h2 className="text-lg font-semibold mb-2 text-black">
          Select Questions to Import
        </h2>
        <div className="max-h-[250px] overflow-y-auto text-black">
          {questionBankData.map((q) => (
            <div key={q.id} className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={selectedQuestions.includes(q.id)}
                onChange={() => toggleSelect(q.id)}
              />
              <span>{q.questionText}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => onImport(selectedQuestions)}
          className="bg-black text-white px-3 py-1 rounded mt-4"
        >
          Import Selected
        </button>
      </div>
    </div>
  );
}

/**
 * COMPONENT: QuestionPaperEditPage
 * --------------------------------
 * Displays an editable question paper with sections and questions.
 * Features:
 *  - Panel with sections on the left:
 *      - question numbering from 1...n within each section
 *      - reorder questions with drag-and-drop
 *      - button to import from question bank
 *  - Right panel for editing the currently selected question
 *  - Create new question (MCQ or Descriptive) in any section
 *  - Import multiple questions from question bank
 *  - Save, delete, reorder
 */
export const CustomPaperCreatePage = () => {
  const location = useLocation();
  // The state object is available on location.state
  const { questionPaperId } = location.state || {};

  /**
   * The question-paper object from the backend might look like:
   * {
   *   id: 254,
   *   name: "Dummy",
   *   grade: 9,
   *   subject: "Science",
   *   sections: [
   *     { name: "A", questions: [ ... ] },
   *     { name: "B", questions: [ ... ] }
   *   ]
   * }
   */
  // We'll store the data in 'sections'
  const [sections, setSections] = useState([]);

  // For selecting & editing a question:
  const [originalQuestion, setOriginalQuestion] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState(null);
  const [questionImageFile, setQuestionImageFile] = useState(null);

  // For searching questions in left panel
  const [searchTerm, setSearchTerm] = useState("");

  // For adding a new question:
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [sectionForNewQuestion, setSectionForNewQuestion] = useState(null);
  // For the new question form
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

  // For optional marking logic
  const [selectedOptionalQuestions, setSelectedOptionalQuestions] = useState(
    []
  );

  // For panel resizing
  const [leftPanelWidth, setLeftPanelWidth] = useState(33);
  const [isResizing, setIsResizing] = useState(false);

  // For "Import from Question Bank" modal
  const [showBankModal, setShowBankModal] = useState({
    visible: false,
    sectionName: null, // the section we will import into
  });

  // =============== MOUSE EVENTS FOR RESIZING PANELS ===============
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      let newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth < 15) newWidth = 15;
      if (newWidth > 60) newWidth = 60;
      setLeftPanelWidth(newWidth);
    };
    const handleMouseUp = () => isResizing && setIsResizing(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const handleMouseDown = () => setIsResizing(true);

  // =============== FETCH QUESTION PAPER DATA ===============
  const fetchQuestionPaperDetails = async () => {
    try {
      const response = await getRequest(
        `${BASE_URL_API}/questionPaper/${questionPaperId}`
      );
      if (response?.success) {
        // The response might have "sections"
        // Example: response.questionPaper.sections
        setSections(response.questionPaper.sections || []);
      } else {
        console.error("Failed to fetch question paper details:", response);
      }
    } catch (error) {
      console.error("Error fetching question paper details:", error);
    }
  };

  useEffect(() => {
    fetchQuestionPaperDetails();
  }, []);

  // =============== QUESTION CLICK / SELECTION ===============
  const handleQuestionClick = (question) => {
    setOriginalQuestion(question);
    setEditedQuestion(JSON.parse(JSON.stringify(question)));
    setQuestionImageFile(null);
  };

  // Are changes made to the question?
  const isModified =
    editedQuestion && originalQuestion
      ? JSON.stringify(editedQuestion) !== JSON.stringify(originalQuestion) ||
        questionImageFile !== null
      : false;

  // =============== RENDERING MATH UTILS ===============
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

  // =============== SEARCH-BASED FILTERING ===============
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
  const visibleSections = getFilteredSections();
  const isEditingMath = editedQuestion?.questionText?.includes("$");

  // =============== OPTIONAL GROUP ===============
  const toggleOptionalSelection = (questionId, e) => {
    e.stopPropagation();
    setSelectedOptionalQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleMarkAsOptional = async () => {
    // Only proceed if exactly 2 questions are selected
    if (selectedOptionalQuestions.length !== 2) return;
    const optionalGroupId = uuidv4(); // unique grouping

    const updatedSections = sections.map((section) => {
      const updatedQuestions = section.questions.map((q) =>
        selectedOptionalQuestions.includes(q.id) ? { ...q, optionalGroupId } : q
      );
      return { ...section, questions: updatedQuestions };
    });
    setSections(updatedSections);

    // We can store the entire question-paper object
    const payload = {
      id: questionPaperId,
      sections: updatedSections,
    };
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

  // =============== EDITING FIELD HANDLERS ===============
  const handleQuestionTextChange = (e) => {
    setEditedQuestion((prev) => ({ ...prev, questionText: e.target.value }));
  };
  const handleTypeChange = (e) => {
    setEditedQuestion((prev) => ({ ...prev, type: e.target.value }));
  };
  const handleDifficultyChange = (e) => {
    setEditedQuestion((prev) => ({ ...prev, difficulty: e.target.value }));
  };
  const handleMarksChange = (e) => {
    setEditedQuestion((prev) => ({ ...prev, marks: e.target.value }));
  };
  const handleOptionChange = (index, newValue) => {
    setEditedQuestion((prev) => {
      const updatedOptions = [...(prev.options || [])];
      updatedOptions[index] = { ...updatedOptions[index], option: newValue };
      return { ...prev, options: updatedOptions };
    });
  };

  // =============== IMAGE CHANGES ===============
  const handleQuestionImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setQuestionImageFile(file);
  };
  const handleDeleteQuestionImage = () => {
    setQuestionImageFile(null);
    setEditedQuestion((prev) => ({ ...prev, imageUrl: "" }));
  };
  const handleDiscardQuestionImage = () => {
    setQuestionImageFile(null);
  };
  const handleOptionImageChange = (index, file) => {
    setEditedQuestion((prev) => {
      const updatedOptions = [...(prev.options || [])];
      updatedOptions[index] = { ...updatedOptions[index], imageFile: file };
      return { ...prev, options: updatedOptions };
    });
  };
  const handleDeleteOptionImage = (index) => {
    setEditedQuestion((prev) => {
      const updatedOptions = [...(prev.options || [])];
      delete updatedOptions[index].imageUrl;
      delete updatedOptions[index].imageFile;
      return { ...prev, options: updatedOptions };
    });
  };
  const handleDiscardOptionImage = (index) => {
    setEditedQuestion((prev) => {
      const updatedOptions = [...(prev.options || [])];
      if (updatedOptions[index].imageFile) {
        delete updatedOptions[index].imageFile;
      }
      return { ...prev, options: updatedOptions };
    });
  };

  // =============== SAVE (EDITED) QUESTION ===============
  const handleSave = async () => {
    try {
      let updatedImageUrl = editedQuestion.imageUrl || "";
      if (questionImageFile) {
        const generatedLink = `https://tutor-staffroom-files.s3.amazonaws.com/${Date.now()}-${
          questionImageFile.name
        }`;
        updatedImageUrl = await uploadToS3(questionImageFile, generatedLink);
      }
      // handle options with potential imageFile
      const updatedOptions = await Promise.all(
        (editedQuestion.options || []).map(async (opt) => {
          let updatedOpt = { ...opt };
          if (opt.imageFile) {
            const generatedLink = `https://tutor-staffroom-files.s3.amazonaws.com/${Date.now()}-${
              opt.imageFile.name
            }`;
            const uploadedUrl = await uploadToS3(opt.imageFile, generatedLink);
            updatedOpt.imageUrl = uploadedUrl;
            delete updatedOpt.imageFile;
          }
          return updatedOpt;
        })
      );
      const finalQuestion = {
        ...editedQuestion,
        imageUrl: updatedImageUrl,
        options: updatedOptions,
        difficulty: editedQuestion.difficulty?.toLowerCase(),
      };

      // Reuse your "question/upsert" approach from the snippet:
      // Then refresh the question paper
      const response = await postRequest(`${BASE_URL_API}/question/upsert`, {
        ...finalQuestion,
        questionPaperId: parseInt(questionPaperId),
        id: finalQuestion.id, // for editing
      });
      if (response && response.success) {
        alert("Question updated successfully!");
      } else {
        alert("Failed to update question.");
      }
      await fetchQuestionPaperDetails();
      setOriginalQuestion(null);
      setEditedQuestion(null);
      setQuestionImageFile(null);
    } catch (error) {
      console.error("Error saving question:", error);
      alert("Error saving question.");
    }
  };

  // =============== DELETE QUESTION ===============
  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?"))
      return;
    try {
      // We assume you already have an endpoint or snippet to remove question from the paper
      // e.g. /questionPaper/removeQuestion
      const res = await postRequest(
        `${BASE_URL_API}/questionPaper/removeQuestion`,
        {
          questionId,
          questionPaperId: parseInt(questionPaperId),
        }
      );
      if (res?.success) {
        alert("Question deleted successfully");
        await fetchQuestionPaperDetails();
        if (editedQuestion && editedQuestion.id === questionId) {
          setOriginalQuestion(null);
          setEditedQuestion(null);
        }
      } else {
        alert("Failed to delete question.");
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      alert("Error deleting question.");
    }
  };

  // =============== DRAG AND DROP REORDERING ===============
  const handleDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;

    // Only handle reordering within the same section for simplicity
    if (source.droppableId === destination.droppableId) {
      const sectionIndex = parseInt(source.droppableId, 10);
      const section = sections[sectionIndex];
      const newQuestions = Array.from(section.questions);
      const [removed] = newQuestions.splice(source.index, 1);
      newQuestions.splice(destination.index, 0, removed);

      const updatedSections = [...sections];
      updatedSections[sectionIndex] = { ...section, questions: newQuestions };
      setSections(updatedSections);

      // If you want to persist order changes, do so here
      // e.g. questionPaper/update or questionPaper/addQuestions with new orderIndices
      // For demonstration, just do questionPaper/update:
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
      }
      await fetchQuestionPaperDetails();
    }
  };

  // =============== CREATE NEW QUESTION ===============
  const handleAddQuestionForSection = (sectionName) => {
    setSectionForNewQuestion(sectionName);
    setShowAddQuestionModal(true);

    // Reset new question form
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

  // For text-based changes in new question form
  const handleNewQuestionChange = (e, field, index) => {
    if (["type", "questionText", "marks", "difficulty"].includes(field)) {
      setNewQuestion((prev) => ({ ...prev, [field]: e.target.value }));
    } else if (field === "option" && typeof index === "number") {
      setNewQuestion((prev) => {
        const newOptions = [...prev.options];
        newOptions[index].option = e.target.value;
        return { ...prev, options: newOptions };
      });
    }
  };

  const handleMathKeyDown = (e, field, index) => {
    // Optional logic for SHIFT+$ or something
  };

  const handleQuestionImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewQuestion((prev) => ({
      ...prev,
      imageFile: file,
      imageUrl: URL.createObjectURL(file),
    }));
  };

  const handleOptionImageUpload = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewQuestion((prev) => {
      const newOptions = [...prev.options];
      newOptions[index] = {
        ...newOptions[index],
        imageFile: file,
        imageUrl: URL.createObjectURL(file),
      };
      return { ...prev, options: newOptions };
    });
  };

  // A simple function to figure out the next order index
  const calculateNextOrderIndex = (sectionName) => {
    const foundSection = sections.find((sec) => sec.name === sectionName);
    if (!foundSection) return 1;
    // e.g. length + 1
    return foundSection.questions.length + 1;
  };

  /**
   * Actually CREATE a new question and then associate it with the paper.
   * 1) Upsert the question => get questionId
   * 2) Call /questionPaper/addQuestions with that questionId, specifying orderIndex & section
   */
  const handleNewQuestionSubmit = async () => {
    try {
      // 1) Upsert the question to create or get questionId
      let uploadedQuestionImageUrl = newQuestion.imageUrl || "";
      if (newQuestion.imageFile) {
        const generatedLink = `https://tutor-staffroom-files.s3.amazonaws.com/${Date.now()}-${
          newQuestion.imageFile.name
        }`;
        uploadedQuestionImageUrl = await uploadToS3(
          newQuestion.imageFile,
          generatedLink
        );
      }

      // Possibly upload each option image if MCQ
      const updatedOptions = await Promise.all(
        (newQuestion.options || []).map(async (opt) => {
          const updatedOpt = { ...opt };
          if (opt.imageFile) {
            const generatedLink = `https://tutor-staffroom-files.s3.amazonaws.com/${Date.now()}-${
              opt.imageFile.name
            }`;
            const uploadedUrl = await uploadToS3(opt.imageFile, generatedLink);
            updatedOpt.imageUrl = uploadedUrl;
            delete updatedOpt.imageFile;
          }
          return updatedOpt;
        })
      );

      // We'll first create the question in the DB (like your snippet uses /question/upsert)
      let createQuestionBody = {
        ...newQuestion,
        imageUrl: uploadedQuestionImageUrl,
        options: newQuestion.type === "MCQ" ? updatedOptions : undefined,
        difficulty: newQuestion.difficulty?.toLowerCase(),
      };

      const createRes = await postRequest(
        `${BASE_URL_API}/question/upsert`,
        createQuestionBody
      );
      if (!createRes?.success || !createRes?.id) {
        alert("Failed to create question. Aborting...");
        return;
      }

      // 2) Now add the newly created question to the question paper with the correct "section" & "orderIndex"
      const newQuestionId = createRes.id; // backend should return 'id' or questionId
      const orderIndex = calculateNextOrderIndex(sectionForNewQuestion);

      // The addQuestions endpoint expects an array of questionDetails
      const addReqBody = {
        questionPaperId: parseInt(questionPaperId),
        questionDetails: [
          {
            questionId: newQuestionId,
            orderIndex,
            section: sectionForNewQuestion,
          },
        ],
      };

      const addRes = await postRequest(
        `${BASE_URL_API}/questionPaper/addQuestions`,
        addReqBody
      );
      if (addRes?.success) {
        alert("New question added successfully!");
      } else {
        alert("Failed to add question to paper.");
      }

      // Refresh
      await fetchQuestionPaperDetails();
      // Close modal
      setShowAddQuestionModal(false);
      setSectionForNewQuestion(null);
      // Reset
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

  // =============== IMPORT FROM QUESTION BANK ===============
  const handleImportQuestions = async (selectedIds) => {
    if (!selectedIds || selectedIds.length === 0) {
      setShowBankModal({ visible: false, sectionName: null });
      return;
    }
    // For each question, we need an orderIndex
    const foundSection = sections.find(
      (sec) => sec.name === showBankModal.sectionName
    );
    const baseIndex = foundSection ? foundSection.questions.length : 0;

    const questionDetails = selectedIds.map((qId, i) => ({
      questionId: qId,
      orderIndex: baseIndex + i + 1,
      section: showBankModal.sectionName,
    }));

    // We call the /questionPaper/addQuestions endpoint
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

  return (
    <div className="flex h-screen overflow-hidden fixed inset-0">
      {/* ===================== LEFT PANEL (SECTIONS + QUESTIONS) ===================== */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div
          className="border-r p-4 overflow-y-auto"
          style={{ width: `${leftPanelWidth}%`, minWidth: "15%" }}
        >
          {/* Search box */}
          <div className="mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search questions..."
              className="w-full p-2 border rounded"
            />
          </div>

          {/* If exactly 2 non-MCQ selected => show Mark as optional */}
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

          {visibleSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-6">
              {/* Section Heading */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">Section {section.name}</h3>
                <div className="flex items-center gap-2">
                  {/* Button: Add new question to this section */}
                  <button
                    onClick={() => handleAddQuestionForSection(section.name)}
                    className="p-2 rounded bg-black text-white flex items-center justify-center"
                    title="Add a new question to this section"
                  >
                    <Plus size={16} className="text-white" />
                  </button>
                  {/* Button: Import from question bank to this section */}
                  <button
                    onClick={() =>
                      setShowBankModal({
                        visible: true,
                        sectionName: section.name,
                      })
                    }
                    className="p-2 rounded bg-black text-white text-sm"
                  >
                    Import
                  </button>
                </div>
              </div>

              <Droppable droppableId={`${sectionIndex}`}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {section.questions.map((question, index) => {
                      const isSelected = editedQuestion?.id === question.id;
                      // numbering = index+1
                      const questionNumber = index + 1;
                      return (
                        <Draggable
                          key={question.id}
                          draggableId={`${question.id}`}
                          index={index}
                        >
                          {(dragProvided) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              onClick={() => handleQuestionClick(question)}
                              className={`flex justify-between items-center p-3 mb-3 rounded shadow cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-blue-50 border-l-4 border-blue-500"
                                  : "bg-white hover:bg-gray-100"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {/* numbering */}
                                <span className="text-xs font-bold text-gray-700">
                                  {questionNumber}.
                                </span>
                                {/* For non-MCQ, optional checkbox */}
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
                                  />
                                )}
                                <span>
                                  {renderTruncatedTextWithMath(
                                    question.questionText,
                                    60
                                  )}
                                </span>
                                {/* If optional */}
                                {question.optionalGroupId && (
                                  <span className="ml-2 text-xs font-bold text-green-800 bg-green-200 px-1 rounded">
                                    Optional
                                  </span>
                                )}
                              </div>
                              {/* Delete button */}
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
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* ===================== RESIZE HANDLE ===================== */}
      <div
        onMouseDown={handleMouseDown}
        style={{ width: "5px", cursor: "col-resize" }}
        className="bg-gray-300"
      />

      {/* ===================== RIGHT PANEL (EDIT SELECTED QUESTION) ===================== */}
      <div
        className="p-4 overflow-hidden"
        style={{ width: `${100 - leftPanelWidth}%`, minWidth: "40%" }}
      >
        {!originalQuestion ? (
          <div className="text-gray-500">Select a question to edit</div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">Question Details</h2>
              {editedQuestion?.optionalGroupId && (
                <span className="bg-green-200 text-green-800 text-xs px-2 py-1 rounded">
                  Optional
                </span>
              )}
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

            {/* MAIN FIELDS */}
            <div className="flex flex-col md:flex-row md:items-start gap-4">
              <div className="md:w-1/2">
                {/* TYPE, DIFFICULTY, MARKS */}
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

                {/* QUESTION TEXT */}
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

                {/* QUESTION IMAGE */}
                <div className="mt-4 flex items-center gap-2">
                  <span className="font-semibold">Question Image:</span>
                  {editedQuestion.imageUrl || questionImageFile ? (
                    <div className="flex items-center gap-2 ml-4">
                      <img
                        src={
                          questionImageFile
                            ? URL.createObjectURL(questionImageFile)
                            : editedQuestion.imageUrl
                        }
                        alt="Question"
                        className="max-w-xs"
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

              {/* MATH PREVIEW (only if questionText has $) */}
              {isEditingMath && (
                <div className="md:w-1/2 border-l pl-4">
                  <h3 className="font-semibold mb-2">Math Preview</h3>
                  <div className="bg-gray-50 p-3 rounded">
                    {renderTextWithMath(editedQuestion.questionText)}
                  </div>
                </div>
              )}
            </div>

            {/* MCQ OPTIONS */}
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
                        {/* Option image handling */}
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
                      {/* Option math preview */}
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

      {/* ================= ADD NEW QUESTION MODAL ================= */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white w-[600px] max-h-[80vh] overflow-auto rounded p-4 relative">
            <button
              onClick={() => {
                setShowAddQuestionModal(false);
                setSectionForNewQuestion(null);
              }}
              className="absolute top-2 right-2 text-black font-bold"
            >
              X
            </button>
            <h3 className="text-lg font-semibold mb-4 text-black">
              Add New Question (Section {sectionForNewQuestion})
            </h3>

            {/* Question Type */}
            <div className="mb-4">
              <label className="block mb-1 font-medium text-black">
                Question Type
              </label>
              <select
                value={newQuestion.type}
                onChange={(e) => handleNewQuestionChange(e, "type")}
                className="border rounded px-2 py-1 w-full"
              >
                <option value="MCQ">MCQ</option>
                <option value="Descriptive">Descriptive</option>
              </select>
            </div>

            {/* Question Text */}
            <div className="mb-4">
              <label className="block mb-1 font-medium text-black">
                Question Text
              </label>
              <textarea
                value={newQuestion.questionText}
                onChange={(e) => handleNewQuestionChange(e, "questionText")}
                onKeyDown={(e) => handleMathKeyDown(e, "questionText")}
                className="border rounded px-2 py-1 w-full"
                rows={4}
                placeholder="Enter question text (use $ for math expressions if needed)"
              />
              <div className="mt-2 text-sm text-gray-500">
                Preview: {renderTextWithMath(newQuestion.questionText)}
              </div>
            </div>

            {/* Optional question image */}
            <div className="mb-4 text-black">
              <label className="block mb-1 font-medium">Question Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleQuestionImageUpload}
              />
              {newQuestion.imageUrl && (
                <img
                  src={newQuestion.imageUrl}
                  alt="Preview"
                  className="mt-2 w-32 h-32 border rounded object-cover"
                />
              )}
            </div>

            {/* MCQ options if type=MCQ */}
            {newQuestion.type === "MCQ" && (
              <div className="mb-4 text-black">
                <label className="block mb-1 font-medium">Options</label>
                {newQuestion.options.map((opt, idx) => (
                  <div key={opt.key} className="mb-4 border p-2 rounded">
                    <label className="block text-sm font-medium text-black">
                      Option {opt.key}
                    </label>
                    <input
                      type="text"
                      value={opt.option}
                      onChange={(e) =>
                        handleNewQuestionChange(e, "option", idx)
                      }
                      onKeyDown={(e) => handleMathKeyDown(e, "option", idx)}
                      className="border rounded px-2 py-1 w-full mb-1"
                    />
                    <div className="mt-1 text-sm text-gray-500">
                      Preview: {renderTextWithMath(opt.option)}
                    </div>
                    <div className="mt-2">
                      <label className="block text-sm font-medium">
                        Option {opt.key} Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleOptionImageUpload(e, idx)}
                        className="block"
                      />
                      {opt.imageUrl && (
                        <img
                          src={opt.imageUrl}
                          alt={`Option ${opt.key} preview`}
                          className="mt-2 rounded w-24 h-24 border"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Marks + Difficulty */}
            <div className="flex gap-4 mb-4 text-black">
              <div className="flex-1">
                <label className="block mb-1 font-medium">Marks</label>
                <input
                  type="number"
                  value={newQuestion.marks}
                  onChange={(e) => handleNewQuestionChange(e, "marks")}
                  className="border rounded px-2 py-1 w-full"
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
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowAddQuestionModal(false);
                  setSectionForNewQuestion(null);
                }}
                className="px-3 py-1 border border-black rounded bg-white text-black"
              >
                Cancel
              </button>
              <button
                onClick={handleNewQuestionSubmit}
                className="px-3 py-1 border border-black rounded bg-black text-white"
              >
                Save Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= IMPORT FROM QUESTION BANK MODAL ================= */}
      {showBankModal.visible && (
        <QuestionBankModal
          onClose={() =>
            setShowBankModal({ visible: false, sectionName: null })
          }
          onImport={handleImportQuestions}
        />
      )}
    </div>
  );
};
