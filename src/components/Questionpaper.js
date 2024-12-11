import React, { useState, useEffect } from "react";
import { openai } from "./InitOpenAI";
import { jsPDF } from "jspdf"; // Import jsPDF

const GenerateQuestionPaper = () => {
  const [standard, setStandard] = useState("");
  const [subject, setSubject] = useState("");
  const [topics, setTopics] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [marks, setMarks] = useState("");
  const [mcqs, setMcqs] = useState("");
  const [anyotherQuery, setAnyOtherQuery] = useState("");
  const [responseText, setResponseText] = useState("");
  const [isLoading, setIsLoading] = useState(false); // State to track loading

  // Demo topics
  const allTopics = {
    science: {
      1: ["Living and Non-living", "Basic Shapes in Nature"],
      2: ["Plants and Their Uses", "Types of Animals"],
      3: ["Solar System Basics", "Simple Machines"],
      4: ["Food and Nutrition", "Environmental Pollution"],
      5: ["Human Body Systems", "States of Matter"],
      6: ["Electricity and Circuits", "Respiration in Plants"],
      7: ["Acids and Bases", "Heat and Temperature"],
      8: ["Light and Sound", "Cell Structure"],
      9: ["Atoms and Molecules", "Ecosystems"],
      10: ["Genetics Basics", "Newton's Laws"],
      11: ["Chemical Reactions", "Electromagnetism"],
      12: ["Organic Chemistry", "Modern Physics"],
    },
    maths: {
      1: ["Counting and Numbers", "Basic Shapes"],
      2: ["Addition and Subtraction", "Measurement Basics"],
      3: ["Multiplication and Division", "Patterns and Sequences"],
      4: ["Fractions", "Basic Geometry"],
      5: ["Decimals", "Angles and Triangles"],
      6: ["Ratios and Proportions", "Integers"],
      7: ["Algebraic Expressions", "Coordinate Geometry"],
      8: ["Linear Equations", "Data Handling"],
      9: ["Polynomials", "Trigonometry Basics"],
      10: ["Quadratic Equations", "Circles"],
      11: ["Limits and Continuity", "Probability"],
      12: ["Differential Calculus", "Integral Calculus"],
    },
  };

  useEffect(() => {
    if (standard && subject) {
      setTopics(allTopics[subject][standard] || []);
      setSelectedTopics([]);
    } else {
      setTopics([]);
      setSelectedTopics([]);
    }
  }, [standard, subject]);

  const handleAddTopic = (topic) => {
    if (!selectedTopics.includes(topic)) {
      setSelectedTopics((prev) => [...prev, topic]);
    }
  };

  const handleRemoveTopic = (topicToRemove) => {
    setSelectedTopics(selectedTopics.filter((t) => t !== topicToRemove));
  };

  const generatePrompt = () => {
    return `Generate a question paper for:
    Standard: ${standard}
    Subject: ${subject.charAt(0).toUpperCase() + subject.slice(1)}
    Topics: ${selectedTopics.join(", ")}
    Total Marks: ${marks}
    Number of MCQs: ${mcqs}
    Additional input: ${anyotherQuery}

    Instructions: Create a well-structured and balanced question paper, ensuring topics are proportionally represented.`;
  };

  const generateQuestionPaper = async () => {
    try {
      setIsLoading(true);
      const prompt = generatePrompt();
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
      });
      console.log(response)
      const content = response.choices?.[0]?.message?.content || "";
      setResponseText(content);
    } catch (e) {
      console.log('error occurred', e);
    } finally {
      setIsLoading(false); // Hide loader after response
    }
  };

  const generatePDF = () => {
    if (!responseText) return;

    const doc = new jsPDF({
      orientation: "p",
      unit: "pt",
      format: "A4",
    });

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(12);

    const lines = doc.splitTextToSize(responseText, 500);
    doc.text(lines, 50, 50);
    doc.save("question-paper.pdf");
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Generate Question Paper</h1>

      <div style={styles.formGroup}>
        <label style={styles.label}>Select Standard</label>
        <select
          style={styles.select}
          value={standard}
          onChange={(e) => setStandard(e.target.value)}
        >
          <option value="">--Select--</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Select Subject</label>
        <select
          style={styles.select}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        >
          <option value="">--Select--</option>
          <option value="science">Science</option>
          <option value="maths">Maths</option>
        </select>
      </div>

      {topics.length > 0 && (
        <div style={styles.formGroup}>
          <label style={styles.label}>Select Topics to Include</label>
          <div style={styles.topicSelectContainer}>
            <select
              style={styles.select}
              onChange={(e) => {
                if (e.target.value) handleAddTopic(e.target.value);
              }}
            >
              <option value="">--Select Topic--</option>
              {topics.map((t, idx) => (
                <option key={idx} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          {selectedTopics.length > 0 && (
            <div style={styles.selectedTopicsContainer}>
              {selectedTopics.map((topic, idx) => (
                <div style={styles.topicChip} key={idx}>
                  {topic}
                  <button
                    style={styles.removeButton}
                    onClick={() => handleRemoveTopic(topic)}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={styles.formGroup}>
        <label style={styles.label}>Total Marks</label>
        <input
          type="number"
          style={styles.input}
          value={marks}
          onChange={(e) => setMarks(e.target.value)}
          placeholder="e.g. 100"
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Number of MCQs (optional)</label>
        <input
          type="number"
          style={styles.input}
          value={mcqs}
          onChange={(e) => setMcqs(e.target.value)}
          placeholder="e.g. 10"
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Any other query</label>
        <input
          type="text"
          style={styles.input}
          value={anyotherQuery}
          onChange={(e) => setAnyOtherQuery(e.target.value)}
          placeholder="Mark problems as section A"
        />
      </div>

      <button
        style={styles.generateButton}
        onClick={generateQuestionPaper}
        disabled={!standard || !subject || !marks || isLoading}
      >
        {isLoading ? "Loading..." : "Generate Prompt"}
      </button>

      {responseText && (
        <div style={styles.resultContainer}>
          <h2 style={styles.subTitle}>Preview Generated Question Paper</h2>
          <pre style={styles.responsePre}>{responseText}</pre>
          <button style={styles.generateButton} onClick={generatePDF}>
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "1.5rem",
    fontFamily: "'Helvetica Neue', sans-serif",
    color: "#333",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: "1.5rem",
    color: "#2c3e50",
  },
  subTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    marginBottom: "1rem",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    fontSize: "1rem",
    fontWeight: "500",
    marginBottom: "0.25rem",
    color: "#2c3e50",
  },
  select: {
    padding: "0.5rem",
    fontSize: "1rem",
    border: "1px solid #ccc",
    borderRadius: "4px",
    outline: "none",
    background: "#fff",
    cursor: "pointer",
  },
  topicSelectContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  selectedTopicsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    marginTop: "0.5rem",
  },
  topicChip: {
    background: "#e0f7fa",
    padding: "0.5rem 0.75rem",
    borderRadius: "20px",
    display: "inline-flex",
    alignItems: "center",
    fontSize: "0.9rem",
    fontWeight: "500",
    color: "#006064",
  },
  removeButton: {
    marginLeft: "0.5rem",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    color: "#006064",
    fontWeight: "bold",
  },
  input: {
    padding: "0.5rem",
    fontSize: "1rem",
    border: "1px solid #ccc",
    borderRadius: "4px",
    outline: "none",
  },
  generateButton: {
    marginTop: "1rem",
    background: "#1abc9c",
    color: "#fff",
    border: "none",
    padding: "0.75rem",
    fontSize: "1rem",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "background 0.3s",
  },
  resultContainer: {
    marginTop: "2rem",
  },
  responsePre: {
    background: "#f4f4f4",
    padding: "1rem",
    borderRadius: "4px",
    whiteSpace: "pre-wrap",
    fontFamily: "monospace",
    fontSize: "0.95rem",
  },
};

export default GenerateQuestionPaper;
