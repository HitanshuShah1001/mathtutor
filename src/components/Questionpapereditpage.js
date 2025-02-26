import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Trash, Image as ImageIcon } from "lucide-react";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import { deleteRequest, postRequest } from "../utils/ApiCall";
import { uploadToS3 } from "../utils/s3utils";
import { BASE_URL_API } from "../constants/constants";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const QuestionPaperEditPage = () => {
  const { docId } = useParams();
  const location = useLocation();

  const [sections, setSections] = useState([]);
  const [originalQuestion, setOriginalQuestion] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState(null);
  // This holds a new image file for the question (if selected)
  const [questionImageFile, setQuestionImageFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (location.state && location.state.sections) {
      setSections(location.state.sections);
    }
  }, [location.state]);

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
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = sections.map((section) => {
      const filteredQuestions = section.questions.filter((q) =>
        q.questionText.toLowerCase().includes(lowerSearch)
      );
      return { ...section, questions: filteredQuestions };
    });
    return filtered.filter((section) => section.questions.length > 0);
  };

  const visibleSections = getFilteredSections();
  const isEditingMath = editedQuestion?.questionText?.includes("$");

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

  // ---------------------------
  // Question Image Handlers
  // ---------------------------

  // When a new file is selected, we update questionImageFile.
  const handleQuestionImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setQuestionImageFile(file);
    }
  };

  // When the user wants to remove the image altogether.
  const handleDeleteQuestionImage = () => {
    setQuestionImageFile(null);
    setEditedQuestion((prev) => ({ ...prev, imageUrl: "" }));
  };

  // When the user wants to discard a new image selection.
  // This reverts back to the original image (if any) by clearing the new file.
  const handleDiscardQuestionImage = () => {
    setQuestionImageFile(null);
  };

  // ---------------------------
  // Option Image Handlers
  // ---------------------------

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

  // When the user wants to remove an option image completely.
  const handleDeleteOptionImage = (index) => {
    setEditedQuestion((prev) => {
      const updatedOptions = [...(prev.options || [])];
      // Remove both imageUrl and imageFile to completely delete the image.
      updatedOptions[index] = { ...updatedOptions[index] };
      delete updatedOptions[index].imageUrl;
      delete updatedOptions[index].imageFile;
      return { ...prev, options: updatedOptions };
    });
  };

  // When the user wants to discard a new image selection for an option.
  // This will simply remove the new file (imageFile) and keep the existing imageUrl.
  const handleDiscardOptionImage = (index) => {
    setEditedQuestion((prev) => {
      const updatedOptions = [...(prev.options || [])];
      if (updatedOptions[index].imageFile) {
        delete updatedOptions[index].imageFile;
      }
      return { ...prev, options: updatedOptions };
    });
  };

  // ---------------------------
  // Save (Upsert) Handler
  // ---------------------------
  const handleSave = async () => {
    try {
      // Handle image upload for the question.
      let updatedImageUrl = editedQuestion.imageUrl || "";
      if (questionImageFile) {
        const generatedLink = `https://tutor-staffroom-files.s3.amazonaws.com/${Date.now()}-${
          questionImageFile.name
        }`;
        updatedImageUrl = await uploadToS3(questionImageFile, generatedLink);
      }

      // Handle image uploads for each option (if present).
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

      // Construct the updated question object.
      const updatedQuestion = {
        ...editedQuestion,
        imageUrl: updatedImageUrl,
        options: updatedOptions,
      };

      // Build payload for upserting the question.
      let payload = {
        ...updatedQuestion,
        difficulty: updatedQuestion.difficulty.toLowerCase(),
        questionPaperId: docId, // Attach the question paper id.
      };

      // Include the question id if we're editing an existing question.
      if (originalQuestion) {
        payload.id = updatedQuestion.id;
      }

      // Remove options if the question type is not "MCQ".
      if (updatedQuestion.type !== "MCQ") {
        delete payload.options;
      }

      // Make the API call to upsert the question.
      const response = await postRequest(
        `${BASE_URL_API}/question/upsert`,
        payload
      );
      console.log("Question upserted:", response);
      if (response && response.success) {
        alert("Question upserted successfully!");

        // Update the sections state by replacing the edited question.
        const updatedSections = sections.map((section) => {
          const updatedQuestions = section.questions.map((question) => {
            if (question.id === updatedQuestion.id) {
              return updatedQuestion;
            }
            return question;
          });
          return { ...section, questions: updatedQuestions };
        });
        setSections(updatedSections);
        setOriginalQuestion(updatedQuestion);
      } else {
        alert("Failed to upsert question.");
      }
    } catch (error) {
      console.error("Error upserting question:", error);
      alert("Error upserting question.");
    }
  };

  // ---------------------------
  // Delete Question Handler
  // ---------------------------
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
        if (res.success === true) {
          alert("Question deleted successfully");
        }
        const updatedSections = sections.map((section) => {
          const updatedQuestions = section.questions.filter(
            (q) => q.id !== questionId
          );
          return { ...section, questions: updatedQuestions };
        });
        setSections(updatedSections);
        if (editedQuestion && editedQuestion.id === questionId) {
          setOriginalQuestion(null);
          setEditedQuestion(null);
        }
      } catch (error) {
        console.error("Error deleting question:", error);
      }
    }
  };

  // ---------------------------
  // Drag and Drop Handler
  // ---------------------------
  const handleDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;

    // Only handle reordering within the same section for now.
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

      // Make the POST call to update the question paper order.
      const response = await postRequest(
        `${BASE_URL_API}/questionPaper/update`,
        payload
      );

      console.log(response, "response received!");
    } else {
      // If needed, handle moving questions between sections.
    }
  };

  return (
    <div className="flex h-screen">
      {/* LEFT PANEL: List sections and questions with drag-and-drop */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="w-1/3 border-r p-4 overflow-y-auto">
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
              <h3 className="font-bold text-lg mb-2">
                Section {section.name}
              </h3>
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

      {/* RIGHT PANEL: Question edit form */}
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
                {/* Editable fields for type, difficulty, marks */}
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

                {/* Question image upload block */}
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
                    <label htmlFor="question-image-input" className="cursor-pointer">
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

            {/* Editable Options */}
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
    </div>
  );
};

export default QuestionPaperEditPage;
