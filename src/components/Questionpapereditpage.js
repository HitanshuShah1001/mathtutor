/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Trash, Image as ImageIcon, Plus } from "lucide-react";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import { postRequest, getRequest } from "../utils/ApiCall";
import { uploadToS3 } from "../utils/s3utils";
import { BASE_URL_API } from "../constants/constants";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { modalContainerClass, modalContentClass } from "./QuestionBank";

const QuestionPaperEditPage = () => {
  const { docId } = useParams();

  const [sections, setSections] = useState([]);
  const [originalQuestion, setOriginalQuestion] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState(null);
  const [questionImageFile, setQuestionImageFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // For adding a new question
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [isEditingNewQuestion, setIsEditingNewQuestion] = useState(false);

  // We will store which section the user clicked the plus sign for
  const [sectionForNewQuestion, setSectionForNewQuestion] = useState(null);

  // State to hold the brand-new question form:
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

  // ----------------------------------------
  // FETCH/REFRESH QUESTION PAPER
  // ----------------------------------------
  const fetchQuestionPaperDetails = async () => {
    try {
      const response = await getRequest(
        `${BASE_URL_API}/questionPaper/${docId}`
      );
      if (response.success) {
        // Adjust based on actual response shape
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

  // ----------------------------------------
  // EDIT functionalities
  // ----------------------------------------
  const handleQuestionClick = (question) => {
    setOriginalQuestion(question);
    setEditedQuestion(JSON.parse(JSON.stringify(question)));
    setQuestionImageFile(null);
  };

  const isModified =
    editedQuestion && originalQuestion
      ? JSON.stringify(editedQuestion) !== JSON.stringify(originalQuestion) ||
        questionImageFile !== null
      : false;

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

  // ----------------------------------------
  // EDIT: changes for question fields
  // ----------------------------------------
  const handleQuestionTextChange = (e) => {
    const newText = e.target.value;
    setEditedQuestion((prev) => ({
      ...prev,
      questionText: newText,
    }));
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setEditedQuestion((prev) => ({
      ...prev,
      type: newType,
    }));
  };

  const handleDifficultyChange = (e) => {
    const newDiff = e.target.value;
    setEditedQuestion((prev) => ({
      ...prev,
      difficulty: newDiff,
    }));
  };

  const handleMarksChange = (e) => {
    const newMarks = e.target.value;
    setEditedQuestion((prev) => ({
      ...prev,
      marks: newMarks,
    }));
  };

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

  // ----------------------------------------
  // EDIT: images
  // ----------------------------------------
  const handleQuestionImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setQuestionImageFile(file);
    }
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
      updatedOptions[index] = {
        ...updatedOptions[index],
        imageFile: file,
      };
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

  // ----------------------------------------
  // EDIT: save/upsert existing question
  // ----------------------------------------
  const handleSave = async () => {
    try {
      let updatedImageUrl = editedQuestion.imageUrl || "";
      if (questionImageFile) {
        const generatedLink = `https://tutor-staffroom-files.s3.amazonaws.com/${Date.now()}-${
          questionImageFile.name
        }`;
        updatedImageUrl = await uploadToS3(questionImageFile, generatedLink);
      }

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

      const updatedQuestion = {
        ...editedQuestion,
        imageUrl: updatedImageUrl,
        options: updatedOptions,
      };

      let payload = {
        ...updatedQuestion,
        difficulty: updatedQuestion.difficulty?.toLowerCase(),
        questionPaperId: docId,
      };
      if (originalQuestion) {
        payload.id = updatedQuestion.id;
      }
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

      setOriginalQuestion(null);
      setEditedQuestion(null);
      setQuestionImageFile(null);
    } catch (error) {
      console.error("Error upserting question:", error);
      alert("Error upserting question.");
    }
  };

  // ----------------------------------------
  // DELETE
  // ----------------------------------------
  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      try {
        const res = await postRequest(
          `${BASE_URL_API}/questionPaper/removeQuestion`,
          {
            questionId,
            questionPaperId: parseInt(docId),
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

  // ----------------------------------------
  // DRAG & DROP
  // ----------------------------------------
  const handleDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;

    if (source.droppableId === destination.droppableId) {
      const sectionIndex = parseInt(source.droppableId, 10);
      const section = sections[sectionIndex];
      const newQuestions = Array.from(section.questions);
      const [removed] = newQuestions.splice(source.index, 1);
      newQuestions.splice(destination.index, 0, removed);

      const updatedSections = [...sections];
      updatedSections[sectionIndex] = { ...section, questions: newQuestions };
      setSections(updatedSections);

      const payload = {
        id: docId,
        sections: updatedSections,
      };
      const response = await postRequest(
        `${BASE_URL_API}/questionPaper/update`,
        payload
      );
      if (!response.success) {
        console.error("Failed to update question paper order", response);
      }

      await fetchQuestionPaperDetails();
    } else {
      // Cross-section moves if needed
    }
  };

  // ----------------------------------------
  // ADD NEW QUESTION
  // (modified to pass the section name)
  // ----------------------------------------
  const handleAddQuestionForSection = (sectionName) => {
    // store which section user clicked for
    setSectionForNewQuestion(sectionName);

    setShowAddQuestionModal(true);
    setIsEditingNewQuestion(false);

    // reset the new question form
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

  // new question handlers
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

  const handleMathKeyDown = (e, field, index) => {
    // same SHIFT+$ logic if you want
  };

  const handleQuestionImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const imageUrl = URL.createObjectURL(file);
    setNewQuestion((prev) => ({ ...prev, imageFile: file, imageUrl }));
  };

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

  // example: a naive approach to compute a trivial orderIndex.
  // If you do more complex logic, place it here.
  const calculateOrderIndex = (q, allSections) => {
    // For demonstration, just return 1. Or do your logic.
    return 1;
  };

  const handleNewQuestionSubmit = async () => {
    try {
      let updatedImageUrl = newQuestion.imageUrl || "";
      if (newQuestion.imageFile) {
        const generatedLink = `https://tutor-staffroom-files.s3.amazonaws.com/${Date.now()}-${
          newQuestion.imageFile.name
        }`;
        updatedImageUrl = await uploadToS3(
          newQuestion.imageFile,
          generatedLink
        );
      }

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

      const orderIndex = calculateOrderIndex(newQuestion, sections);

      // We'll pass sectionForNewQuestion to the backend as well
      const payload = {
        ...newQuestion,
        section: sectionForNewQuestion, // we can pass it if needed
        imageUrl: updatedImageUrl,
        options: newQuestion.type === "MCQ" ? updatedOptions : undefined,
        questionPaperId: docId,
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

  // ----------------------------------------
  // RENDER
  // ----------------------------------------
  return (
    <div className="flex h-screen">
      {/* LEFT PANEL: List sections + drag-and-drop */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="w-1/3 border-r p-4 overflow-y-auto">
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

          {visibleSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-6">
              {/* Section Heading with plus button */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">Section {section.name}</h3>
                <button
                  onClick={() => handleAddQuestionForSection(section.name)}
                  className="p-2 rounded bg-black text-white flex items-center justify-center"
                  title="Add a new question to this section"
                >
                  <Plus size={16} className="text-white" />
                </button>
              </div>

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
                              <div>
                                {renderTruncatedTextWithMath(
                                  question.questionText,
                                  60
                                )}
                              </div>
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

      {/* RIGHT PANEL: Edit question form */}
      <div className="w-2/3 p-4 overflow-y-auto">
        {!originalQuestion ? (
          <div className="text-gray-500">Select a question to edit</div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Question Details</h2>
              {isModified && (
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-500 text-white rounded shadow-md"
                >
                  Save
                </button>
              )}
            </div>

            <div className="flex flex-col md:flex-row md:items-start gap-4">
              <div className="md:w-1/2">
                {/* Editable fields: type, difficulty, marks */}
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

                {/* Editable question text */}
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

                {/* Question image upload */}
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

              {isEditingMath && (
                <div className="md:w-1/2 border-l pl-4">
                  <h3 className="font-semibold mb-2">Math Preview</h3>
                  <div className="bg-gray-50 p-3 rounded">
                    {renderTextWithMath(editedQuestion.questionText)}
                  </div>
                </div>
              )}
            </div>

            {/* Editable Options (only if MCQ) */}
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

            {/* Section we are adding to: */}
            {sectionForNewQuestion && (
              <div className="text-gray-700 mb-2">
                <strong>Section:</strong> {sectionForNewQuestion}
              </div>
            )}

            {/* Question Type */}
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

            {/* Question Text */}
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

            {/* Question Image Upload */}
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

            {/* Options (MCQ only) */}
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

            {/* Marks and Difficulty */}
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

            {/* Modal Actions */}
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
    </div>
  );
};

export default QuestionPaperEditPage;
