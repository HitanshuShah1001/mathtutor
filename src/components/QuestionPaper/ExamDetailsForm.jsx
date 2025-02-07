/* ExamDetailsForm.jsx */

import React from "react";
import { styles } from "./styles";

/**
 * ExamDetailsForm
 *
 * @param {Object} props
 * @param {string} props.title            - The title of the paper
 * @param {string} props.academyName      - The name of the academy
 * @param {string} props.standard         - The selected standard/grade
 * @param {string} props.subject          - The selected subject
 * @param {string} props.marks            - The total marks for the exam
 * @param {string} props.timeDuration     - The time duration for the exam
 * @param {number} props.numberOfSets     - The number of sets (optional)
 * @param {string} props.anyotherQuery    - Additional instructions or queries
 * @param {Function} props.setTitle
 * @param {Function} props.setAcademyName
 * @param {Function} props.setStandard
 * @param {Function} props.setSubject
 * @param {Function} props.setMarks
 * @param {Function} props.setTimeDuration
 * @param {Function} props.setNumberOfSets
 * @param {Function} props.setAnyOtherQuery
 * @param {Function} props.setHasLoadedBlueprint - To reset blueprint loading status
 *
 * @returns {JSX.Element}
 */
const ExamDetailsForm = ({
  title,
  academyName,
  standard,
  subject,
  marks,
  timeDuration,
  numberOfSets,
  anyotherQuery,
  setTitle,
  setAcademyName,
  setStandard,
  setSubject,
  setMarks,
  setTimeDuration,
  setNumberOfSets,
  setAnyOtherQuery,
  setHasLoadedBlueprint,
}) => {
  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Exam Details</h2>

      {/* Title (Required) */}
      <div style={styles.formGroup}>
        <label style={styles.label}>
          Title <span style={{ color: "red" }}>*</span>
        </label>
        <input
          style={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="12 Std. Question Paper"
        />
      </div>

      {/* Academy Name (Optional) */}
      <div style={styles.formGroup}>
        <label style={styles.label}>Academy Name</label>
        <input
          style={styles.input}
          value={academyName}
          onChange={(e) => setAcademyName(e.target.value)}
          placeholder="E.g., Springfield High"
        />
      </div>

      {/* Standard (Required) */}
      <div style={styles.formGroup}>
        <label style={styles.label}>
          Standard <span style={{ color: "red" }}>*</span>
        </label>
        <select
          style={styles.select}
          value={standard}
          onChange={(e) => {
            setHasLoadedBlueprint(false); // Reset blueprint loaded status
            setStandard(e.target.value);
          }}
        >
          <option value="">Select Standard</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>
      </div>

      {/* Subject (Required) */}
      <div style={styles.formGroup}>
        <label style={styles.label}>
          Subject <span style={{ color: "red" }}>*</span>
        </label>
        <select
          style={styles.select}
          value={subject}
          onChange={(e) => {
            setHasLoadedBlueprint(false);
            setSubject(e.target.value);
          }}
        >
          <option value="">Select Subject</option>
          <option value="Science">Science</option>
          <option value="Maths">Maths</option>
          {/* Add more subjects as needed */}
        </select>
      </div>

      {/* Total Marks (Required) */}
      <div style={styles.formGroup}>
        <label style={styles.label}>
          Total Marks <span style={{ color: "red" }}>*</span>
        </label>
        <input
          type="number"
          style={styles.input}
          value={marks}
          onChange={(e) => setMarks(e.target.value)}
          placeholder="e.g. 100"
        />
      </div>

      {/* Time Duration (Required) */}
      <div style={styles.formGroup}>
        <label style={styles.label}>
          Time Duration <span style={{ color: "red" }}>*</span>
        </label>
        <input
          style={styles.input}
          value={timeDuration}
          onChange={(e) => setTimeDuration(e.target.value)}
          placeholder="e.g. 2 Hours"
        />
      </div>

      {/* Number of Sets (Optional) */}
      <div style={styles.formGroup}>
        <label style={styles.label}>Number of Sets</label>
        <input
          type="number"
          style={styles.input}
          value={numberOfSets}
          onChange={(e) => setNumberOfSets(e.target.value)}
          placeholder="e.g. 3"
        />
      </div>

      {/* Additional Instructions (Optional) */}
      <div style={styles.formGroup}>
        <label style={styles.label}>Additional Instructions</label>
        <input
          type="text"
          style={styles.input}
          value={anyotherQuery}
          onChange={(e) => setAnyOtherQuery(e.target.value)}
          placeholder="e.g. Mark problems as Section A"
        />
      </div>
    </div>
  );
};

export default ExamDetailsForm;
