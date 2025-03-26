import React from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

// Inline + block modules, but no header
const modules = {
  toolbar: [
    [{ font: [] }],
    [{ size: [] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [
      { list: "ordered" },
      { list: "bullet" },
      { indent: "-1" },
      { indent: "+1" },
    ],
    [{ align: [] }],
    ["clean"],
  ],
};

const formats = [
  "font",
  "size",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "bullet",
  "indent",
  "align",
];

const customEditorStyles = `
  .ql-toolbar button,
  .ql-toolbar .ql-picker {
    border: none;
    color: black;
    background-color: white;
  }
  .ql-toolbar button:hover,
  .ql-toolbar .ql-picker:hover {
    background-color: #333;
  }
  .ql-container {
    color: black;
  }
  .ql-picker-item {
    color: black;
  }
`;

if (typeof document !== "undefined") {
  const styleTag = document.createElement("style");
  styleTag.innerHTML = customEditorStyles;
  document.head.appendChild(styleTag);
}

const RichTextEditor = ({ value, onChange }) => {
    console.log(value,"value")
  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={onChange}
      modules={modules}
      formats={formats}
    />
  );
};

export default RichTextEditor;
