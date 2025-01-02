export const styles = {
  /* Page-wide container */
  pageContainer: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    backgroundColor: "#fff",
    color: "#000",
    minHeight: "100vh",
    padding: "20px",
    margin: 0,
    transition: "all 0.3s ease-in-out",
    /* Optionally, if you have a global fade-in keyframe, you can reference it here */
  },

  /* Main container for the form and content area */
  container: {
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: "6px",
    border: "1px solid #ccc",
    padding: "30px",
    boxSizing: "border-box",
    width: "100%",
  },

  /* Two-column layout container */
  formContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "30px",
    marginBottom: "30px",
  },

  columnLeft: {
    flex: 1,
    minWidth: "300px",
  },

  columnRight: {
    flex: 1,
    minWidth: "300px",
  },

  /* Card-like boxes for grouping form elements */
  card: {
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    borderRadius: "6px",
    padding: "25px",
    marginBottom: "20px",
    boxSizing: "border-box",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },

  cardTitle: {
    marginTop: 0,
    marginBottom: "20px",
    fontSize: "1.25rem",
    fontWeight: 600,
    textAlign: "left",
    borderBottom: "1px solid #ddd",
    paddingBottom: "10px",
  },

  /* Form Controls */
  formGroup: {
    marginBottom: "15px",
    position: "relative",
  },

  label: {
    display: "block",
    marginBottom: "5px",
    fontWeight: 500,
    color: "#000",
  },

  labelSmall: {
    display: "block",
    marginBottom: "5px",
    fontWeight: 400,
    fontSize: "0.9rem",
    color: "#000",
  },

  select: {
    width: "100%",
    padding: "10px",
    borderRadius: "4px",
    border: "1px solid #bbb",
    backgroundColor: "#fff",
    fontSize: "1rem",
    color: "#000",
    outline: "none",
    transition: "border-color 0.2s ease",
  },

  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "4px",
    border: "1px solid #bbb",
    fontSize: "1rem",
    color: "#000",
    outline: "none",
    transition: "border-color 0.2s ease",
  },

  inputSmall: {
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #bbb",
    width: "100%",
    fontSize: "0.9rem",
    color: "#000",
    outline: "none",
    transition: "border-color 0.2s ease",
  },

  /* Action Buttons */
  generateButton: {
    backgroundColor: "#000",
    color: "#fff",
    padding: "12px 24px",
    border: "1px solid #000",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1rem",
    transition: "all 0.3s ease",
  },

  blueprintButton: {
    backgroundColor: "#fff",
    marginLeft: 10,
    color: "#000",
    padding: "12px 24px",
    border: "1px solid #000",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1rem",
    transition: "all 0.3s ease",
  },

  loadButton: {
    backgroundColor: "#fff",
    color: "#000",
    padding: "10px 20px",
    border: "1px solid #000",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1rem",
    transition: "all 0.3s ease",
  },

  printButton: {
    backgroundColor: "#fff",
    color: "#000",
    padding: "10px 20px",
    border: "1px solid #000",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.9rem",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    transition: "all 0.3s ease",
  },

  downloadButton: {
    backgroundColor: "#000",
    color: "#fff",
    padding: "10px 20px",
    border: "1px solid #000",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.9rem",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    transition: "all 0.3s ease",
  },

  actionContainer: {
    textAlign: "center",
    marginTop: "20px",
  },

  /* Hover or active states can be applied in an external CSS or with className */
  /* For inline demonstration, we keep them minimal. */

  /* Topic Selection */
  topicSelectionContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  customTopicContainer: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },

  inputInline: {
    flex: 1,
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #bbb",
    fontSize: "1rem",
    color: "#000",
    outline: "none",
    transition: "border-color 0.2s ease",
  },

  addButton: {
    backgroundColor: "#000",
    color: "#fff",
    border: "1px solid #000",
    borderRadius: "4px",
    padding: "8px 12px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontSize: "1rem",
  },

  /* Selected Topics Chips */
  selectedTopicsChips: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "15px",
  },

  topicChip: {
    backgroundColor: "#f7f7f7",
    color: "#000",
    padding: "6px 12px",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "1px solid #ccc",
    fontSize: "0.9rem",
  },

  chipRemoveButton: {
    backgroundColor: "#fff",
    color: "#000",
    border: "1px solid #000",
    borderRadius: "50%",
    width: "20px",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontSize: "0.9rem",
  },

  /* Topic Config Details */
  topicConfigDetails: {
    marginTop: "20px",
  },

  topicConfigCard: {
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    borderRadius: "6px",
    padding: "15px",
    marginBottom: "15px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },

  topicConfigHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  },

  topicConfigTitle: {
    margin: 0,
    fontSize: "1rem",
    fontWeight: 500,
    color: "#000",
  },

  removeTopicButton: {
    backgroundColor: "#fff",
    color: "#000",
    border: "1px solid #000",
    borderRadius: "4px",
    padding: "6px 12px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontSize: "0.9rem",
  },

  topicConfigGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
  },

  formGroupInline: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },

  /* Descriptive Config */
  descriptiveConfigContainer: {
    marginTop: "20px",
    backgroundColor: "#fafafa",
    border: "1px solid #ddd",
    borderRadius: "6px",
    padding: "15px",
  },

  descriptiveConfigTitle: {
    margin: "0 0 10px",
    fontSize: "1rem",
    fontWeight: 500,
    color: "#000",
  },

  descriptiveConfigRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "10px",
    alignItems: "flex-end",
  },

  descriptiveFieldGroup: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },

  /* Plus Button for adding descriptive question configs */
  plusIconContainer: {
    display: "flex",
    justifyContent: "center",
    marginTop: "10px",
  },

  plusButton: {
    backgroundColor: "#000",
    color: "#fff",
    border: "1px solid #000",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    fontSize: "20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
  },

  /* Marks Tracker for configured marks */
  marksTracker: {
    marginBottom: "10px",
    fontSize: "0.95rem",
  },
};