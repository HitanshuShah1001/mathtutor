import React, { useState, useRef, useEffect } from "react";
import { ArrowDownRight } from "lucide-react";

const ResizableTextarea = ({
  value,
  onChange,
  className = "",
  style = {},
  minHeight = 50,
  defaultHeight = 100,
  ...rest
}) => {
  const [height, setHeight] = useState(defaultHeight);
  const isResizing = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

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

  return (
    <div style={{ position: "relative", ...style }}>
      <textarea
        value={value}
        onChange={onChange}
        className={className}
        style={{
          ...style,
          height,
          resize: "none",
        }}
        {...rest}
      />
      {/* Draggable handle rendered as an arrow */}
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
        }}
      >
        <ArrowDownRight size={16} color="#ccc" />
      </div>
    </div>
  );
};

export default ResizableTextarea;
