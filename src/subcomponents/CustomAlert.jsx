import React from "react";

const CustomAlert = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "20px",
          maxWidth: "400px",
          width: "90%",
          position: "relative",
          animation: "alertFadeIn 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>
          {`
            @keyframes alertFadeIn {
              from {
                opacity: 0;
                transform: scale(0.95);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }

            .alert-button:hover {
              background-color: #f2f2f2;
            }
          `}
        </style>

        <div
          style={{
            marginBottom: "15px",
            fontWeight: "600",
            fontSize: "1.1rem",
            color: "#000",
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginBottom: "20px",
            lineHeight: "1.5",
            color: "#333",
          }}
        >
          {message}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            borderTop: "1px solid #e5e5e5",
            paddingTop: "15px",
          }}
        >
          <button
            className="alert-button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              border: "1px solid #000",
              borderRadius: "4px",
              backgroundColor: "#000",
              color: "#fff",
              cursor: "pointer",
              fontSize: "0.9rem",
              transition: "all 0.2s ease",
              outline: "none",
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomAlert;
