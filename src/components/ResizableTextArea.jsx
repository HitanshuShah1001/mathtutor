import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo
} from "react";
import { ArrowDownRight } from "lucide-react";
import ReactQuill from "react-quill";
import katex from "katex";
import "react-quill/dist/quill.snow.css";
import "katex/dist/katex.min.css";
import "./textarea.css";
if (typeof window !== "undefined") window.katex = katex;

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
  const startY = useRef(0);
  const startHeight = useRef(0);
  const quillRef = useRef(null);
  const fileInputRef = useRef(null);
  const isResizing = useRef(false);

  /* ---------- image upload ---------- */
  const imageHandler = useCallback(() => fileInputRef.current?.click(), []);

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file || !quillRef.current) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const quill  = quillRef.current.getEditor();
      const range  = quill.getSelection(true);

      // ——— insert image ———
      quill.insertEmbed(range.index, "image", ev.target.result, "user");

      // ——— add a NB‑space so the cursor stays on the same line ———
      quill.insertText(range.index + 1, "\u00A0", "user");
      quill.setSelection(range.index + 2, 0);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  /* ---------- memoised quill config ---------- */
  const formats = useMemo(
    () => [
      "header",
      "bold",
      "italic",
      "underline",
      "align",
      "list",
      "bullet",
      "image",
      "formula"
    ],
    []
  );

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, false] }],
          ["bold", "italic", "underline"],
          [{ align: [] }],
          [{ list: "ordered" }, { list: "bullet" }],
          ["image"],
          ["clean"]
        ],
        handlers: { image: imageHandler }
      },
      formula: true
    }),
    [imageHandler]
  );

  /* ---------- give TAB its own “insert spaces” binding ---------- */
  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    // insert four ordinary spaces when TAB is pressed
    quill.keyboard.addBinding(
      { key: 9 },              // 9 = Tab
      (range, ctx) => {
        quill.insertText(range.index, "    ", "user");
        quill.setSelection(range.index + 4, 0);
        return false;          // prevent default focus‑change
      }
    );
  }, []);

  /* ---------- resize logic ---------- */
  const handleMouseDown = (e) => {
    isResizing.current = true;
    startY.current = e.clientY;
    startHeight.current = height;
    e.preventDefault();
  };
  const handleMouseMove = useCallback(
    (e) => {
      if (!isResizing.current) return;
      const newH = startHeight.current + (e.clientY - startY.current);
      setHeight(Math.max(newH, minHeight));
    },
    [minHeight]
  );
  const stopResizing = () => (isResizing.current = false);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [handleMouseMove]);

  /* ---------- propagate changes ---------- */
  const handleEditorChange = (content) =>
    onChange?.({ target: { value: content, html: content } });

  /* ---------- render ---------- */
  return (
    <div style={{ position: "relative", ...style }} className={className}>
      <div className="quill-container" style={{ height, minHeight }}>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value || ""}
          onChange={handleEditorChange}
          modules={modules}
          formats={formats}
          style={{ height: height - 42 }}
          {...rest}
        />

        {/* hidden file input for image upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleImageUpload}
        />
      </div>

      {/* drag handle */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: "absolute",
          bottom: 4,
          right: 4,
          cursor: "se-resize",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10
        }}
      >
        <ArrowDownRight size={16} color="#ccc" />
      </div>
    </div>
  );
};

export default ResizableTextarea;

/* ------------- ADD THIS CSS ------------- */
/* Makes images inline so text can sit beside them */

