import React, { useState, useRef, useEffect } from "react";
import { ArrowDownRight } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // Import Quill styles

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

  // Quill modules/formats
  const modules = {
    toolbar: [
      ["bold", "italic", "underline"],
      [{ align: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ size: ["small", false, "large", "huge"] }],
      ["clean"], // Remove formatting
    ],
  };

  const formats = [
    "bold",
    "italic",
    "underline",
    "align",
    "list",
    "bullet",
    "size",
  ];

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

  // Set up Quill selection handler to prevent formatting when $ is selected
  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();

      // Function to disable toolbar elements
      const disableToolbar = (disabled) => {
        const toolbarButtons = document.querySelectorAll(".ql-toolbar button");
        const toolbarSelects = document.querySelectorAll(".ql-toolbar select");
        const toolbarPickers = document.querySelectorAll(
          ".ql-toolbar .ql-picker-label"
        );

        // Disable/enable direct buttons
        toolbarButtons.forEach((button) => {
          if (disabled) {
            button.setAttribute("disabled", "true");
          } else {
            button.removeAttribute("disabled");
          }
        });

        // Disable/enable select dropdowns
        toolbarSelects.forEach((select) => {
          if (disabled) {
            select.setAttribute("disabled", "true");
          } else {
            select.removeAttribute("disabled");
          }
        });

        // Disable/enable pickers (align, size, etc.)
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



      // Handler for selection change
      const selectionChangeHandler = () => {
        const range = quill.getSelection();
        if (range && range.length > 0) {
          const text = quill.getText(range.index, range.length);

          // If selected text contains $, disable formatting
          if (text.includes("$")) {
            disableToolbar(true);

            // Also prevent keyboard shortcuts
            document.addEventListener("keydown", preventKeyboardShortcuts);
          } else {
            disableToolbar(false);
            document.removeEventListener("keydown", preventKeyboardShortcuts);
          }
        } else {
          // No selection, ensure toolbar is enabled
          disableToolbar(false);
          document.removeEventListener("keydown", preventKeyboardShortcuts);
        }
      };

      // Prevent common formatting keyboard shortcuts
      const preventKeyboardShortcuts = (e) => {
        // Common formatting shortcuts (Ctrl/Cmd + B/I/U)
        if (
          (e.ctrlKey || e.metaKey) &&
          (e.key === "b" || e.key === "i" || e.key === "u")
        ) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      };

      // Intercept text-change to revert any formatting on $ text
      const textChangeHandler = (delta, oldContents, source) => {
        if (source !== "user") return;

        // Check each operation in the delta
        delta.ops.forEach((op) => {
          if (op.retain && op.attributes) {
            // This is a formatting operation
            const affectedText = quill.getText(op.retain, 1);
            if (affectedText.includes("$")) {
              // Text contains $, so revert the formatting
              setTimeout(() => {
                quill.removeFormat(op.retain, 1);
              }, 0);
            }
          }
        });
      };

      // Listen for events
      quill.on("selection-change", selectionChangeHandler);
      quill.on("text-change", textChangeHandler);

      // Clean up event listeners
      return () => {
        quill.off("selection-change", selectionChangeHandler);
        quill.off("text-change", textChangeHandler);
        document.removeEventListener("keydown", preventKeyboardShortcuts);
      };
    }
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
          modules={modules}
          formats={formats}
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
