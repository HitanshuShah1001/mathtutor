// Example style objects (customize as needed).
export const containerStyle = {
  fontFamily: '"Helvetica Neue", Arial, sans-serif',
  display: "flex",
  flexDirection: "column",
  maxWidth: "600px",
  width: "100%",
  margin: "40px auto",
  border: "1px solid #ccc",
  borderRadius: "8px",
  backgroundColor: "#ffffff",
};

export const headerStyle = {
  backgroundColor: "#4CAF50",
  color: "#fff",
  padding: "16px",
  borderTopLeftRadius: "8px",
  borderTopRightRadius: "8px",
  fontSize: "1.25rem",
};

export const chatBodyStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  padding: "16px",
  overflowY: "auto",
  height: "400px",
};

export const messageStyle = (role) => ({
  alignSelf: role === "assistant" ? "flex-start" : "flex-end",
  backgroundColor: role === "assistant" ? "#e0e0e0" : "#d1f1d5",
  color: "#333",
  padding: "8px 12px",
  borderRadius: "10px",
  marginBottom: "8px",
  maxWidth: "70%",
  whiteSpace: "pre-wrap",
});

export const footerStyle = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  padding: "8px",
  borderTop: "1px solid #ccc",
  borderBottomLeftRadius: "8px",
  borderBottomRightRadius: "8px",
};

export const inputStyle = {
  flex: 1,
  padding: "8px",
  border: "1px solid #ccc",
  borderRadius: "4px",
  marginRight: "8px",
};

export const sendButtonStyle = {
  backgroundColor: "#4CAF50",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  padding: "8px 16px",
  cursor: "pointer",
};
