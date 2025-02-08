/* BlueprintModal.jsx */

import React from "react";
import { modalStyles } from "../BlueprintModal"; // or another shared style

/**
 * BlueprintModal
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen           - Whether the modal is open
 * @param {Function} props.onClose         - Function to close the modal
 * @param {Array} props.blueprints         - Array of blueprint objects
 * @param {boolean} props.isLoadingBlueprints - Loading state
 * @param {string} props.blueprintError    - Any error message for blueprint fetch
 * @param {Function} props.handleLoadBlueprint - Callback for when a blueprint is selected
 * 
 * @returns {JSX.Element | null}
 */
const BlueprintModal = ({
  isOpen,
  onClose,
  blueprints,
  isLoadingBlueprints,
  blueprintError,
  handleLoadBlueprint,
}) => {
  if (!isOpen) return null;

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.content}>
        <button style={modalStyles.closeButton} onClick={onClose}>
          ×
        </button>
        <h2 style={{ marginBottom: "20px" }}>Select a Blueprint</h2>

        {isLoadingBlueprints ? (
          <p style={{ color: "#000" }}>Loading blueprints...</p>
        ) : blueprintError ? (
          <p style={{ color: "#666" }}>{blueprintError}</p>
        ) : blueprints.length === 0 ? (
          <p style={{ color: "#666" }}>No blueprints found.</p>
        ) : (
          <div>
            {blueprints.map((bp) => (
              <div
                key={`${bp.id}${bp?.createdAt}/${bp.updatedAt}`}
                style={modalStyles.blueprintItem}
                className="fade-in"
              >
                <div style={modalStyles.blueprintHeader}>
                  <div>
                    <h3 style={{ color: "#000", marginBottom: "5px" }}>
                      {bp.name}
                    </h3>
                    <p style={{ color: "#000", margin: "0" }}>
                      Grade: {bp.grade} | Subject: {bp.subject} | Total Marks:{" "}
                      {bp.totalMarks}
                    </p>
                    <p style={{ color: "#555", margin: "5px 0" }}>
                      Created At:{" "}
                      {new Date(bp?.createdAt).toLocaleDateString("en-GB")}
                    </p>
                    {bp.createdAt !== bp.updatedAt && (
                      <p style={{ color: "#555", margin: "0" }}>
                        Last Updated:{" "}
                        {new Date(bp?.updatedAt).toLocaleDateString("en-GB")}
                      </p>
                    )}
                  </div>
                  <button
                    style={modalStyles.loadButton}
                    className="btn-hover"
                    onClick={() => handleLoadBlueprint(bp)}
                  >
                    Load
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlueprintModal;
