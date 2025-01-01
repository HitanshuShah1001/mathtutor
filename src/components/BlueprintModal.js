// Optional: You can create a separate Modal component for better reusability
export const Blueprintmodal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
      <div style={modalStyles.overlay}>
        <div style={modalStyles.content}>
          <button style={modalStyles.closeButton} onClick={onClose}>
            ×
          </button>
          {children}
        </div>
      </div>
    );
  };
  
  // Styles for the modal
export const modalStyles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    },
    content: {
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "8px",
      width: "80%",
      maxHeight: "80%",
      overflowY: "auto",
      position: "relative",
    },
    closeButton: {
      position: "absolute",
      top: "10px",
      right: "15px",
      background: "transparent",
      border: "none",
      fontSize: "1.5rem",
      cursor: "pointer",
    },
    blueprintItem: {
      borderBottom: "1px solid #ddd",
      padding: "10px 0",
    },
    blueprintHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    loadButton: {
      padding: "5px 10px",
      backgroundColor: "#4CAF50",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
    },
    pagination: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: "20px",
    },
    paginationButton: {
      padding: "5px 10px",
      backgroundColor: "#008CBA",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
    },
  };