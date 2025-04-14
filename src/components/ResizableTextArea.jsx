import React, { useState, useRef, useEffect } from "react";
import { ArrowDownRight } from "lucide-react";
import ReactQuill from "react-quill";
import katex from "katex";
import "react-quill/dist/quill.snow.css";
import "katex/dist/katex.min.css";
// Import your custom styles, which override Quill's tooltip

if (typeof window !== "undefined") {
  window.katex = katex;
}

const ResizableTextarea = ({
  value,
  onChange,
  className = "",
  style = {},
  minHeight = 50,
  defaultHeight = 200,
  ...rest
}) => {
  const [height, setHeight] = useState(defaultHeight);
  const isResizing = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);
  const editorRef = useRef(null);
  const quillRef = useRef(null);

  const handleMouseDown = (e) => {
    isResizing.current = true;
    startY.current = e.clientY;
    startHeight.current = height;
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isResizing.current) return;
    const newHeight = startHeight.current + (e.clientY - startY.current);
    setHeight(newHeight > minHeight ? newHeight : minHeight);
  };

  const handleMouseUp = () => {
    isResizing.current = false;
  };

  // Handle content change
  const handleEditorChange = (content) => {
    if (onChange) {
      onChange({ target: { value: content, html: content } });
    }
  };

  // Define allowed formats including the formula format
  const formats = [
    "bold",
    "italic",
    "underline",
    "align",
    "list",
    "bullet",
    "size",
    "header",
  ];

  // Custom modules with formula
  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, false] }],
        ["bold", "italic", "underline"],
        [{ align: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["clean"],
      ],
    },
    formula: true,
  };

  useEffect(() => {
    const handleWindowMouseMove = (e) => handleMouseMove(e);
    const handleWindowMouseUp = () => handleMouseUp();
    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [height]);

  // If you still need the "$" logic, keep it; otherwise remove
  useEffect(() => {
    if (!quillRef.current) return;
    const quill = quillRef.current.getEditor();
    if (!quill) return;

    const disableToolbar = (disabled) => {
      const toolbarButtons = document.querySelectorAll(".ql-toolbar button");
      const toolbarSelects = document.querySelectorAll(".ql-toolbar select");
      const toolbarPickers = document.querySelectorAll(".ql-toolbar .ql-picker-label");

      toolbarButtons.forEach((button) => {
        disabled
          ? button.setAttribute("disabled", "true")
          : button.removeAttribute("disabled");
      });
      toolbarSelects.forEach((select) => {
        disabled
          ? select.setAttribute("disabled", "true")
          : select.removeAttribute("disabled");
      });
      toolbarPickers.forEach((picker) => {
        if (disabled) {
          picker.setAttribute("aria-disabled", "true");
          picker.style.pointerEvents = "none";
          picker.style.opacity = "0.5";
        } else {
          picker.removeAttribute("aria-disabled");
          picker.style.pointerEvents = "";
          picker.style.opacity = "";
        }
      });
    };

    const preventKeyboardShortcuts = (e) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "b" || e.key === "i" || e.key === "u")
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const selectionChangeHandler = () => {
      const range = quill.getSelection();
      if (range && range.length > 0) {
        const text = quill.getText(range.index, range.length);
        if (text.includes("$")) {
          disableToolbar(true);
          document.addEventListener("keydown", preventKeyboardShortcuts);
        } else {
          disableToolbar(false);
          document.removeEventListener("keydown", preventKeyboardShortcuts);
        }
      } else {
        disableToolbar(false);
        document.removeEventListener("keydown", preventKeyboardShortcuts);
      }
    };

    const textChangeHandler = (delta, oldContents, source) => {
      if (source !== "user") return;
      delta.ops.forEach((op) => {
        if (op.retain && op.attributes) {
          const affectedText = quill.getText(op.retain, 1);
          if (affectedText.includes("$")) {
            setTimeout(() => {
              quill.removeFormat(op.retain, 1);
            }, 0);
          }
        }
      });
    };

    quill.on("selection-change", selectionChangeHandler);
    quill.on("text-change", textChangeHandler);

    return () => {
      quill.off("selection-change", selectionChangeHandler);
      quill.off("text-change", textChangeHandler);
      document.removeEventListener("keydown", preventKeyboardShortcuts);
    };
  }, []);

  return (
    <div style={{ position: "relative", ...style }} className={className}>
      <div
        ref={editorRef}
        className="quill-container"
        style={{
          height: height,
          minHeight: minHeight,
        }}
      >
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value || ""}
          onChange={handleEditorChange}
          formats={formats}
          modules={modules}
          style={{
            height: height - 42, // Subtract toolbar height
            maxHeight: "100%",
          }}
          {...rest}
        />
      </div>

      {/* Draggable handle */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: "absolute",
          bottom: "4px",
          right: "4px",
          cursor: "se-resize",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        <ArrowDownRight size={16} color="#ccc" />
      </div>
    </div>
  );
};

export default ResizableTextarea;
