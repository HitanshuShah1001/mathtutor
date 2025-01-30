import React, { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";

export const DocumentEditor = ({ documentUrl, onSave }) => {
  const [htmlContent, setHtmlContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Fetch the HTML from the server
  useEffect(() => {
    const fetchDocument = async () => {
      if (!documentUrl) return;
      setLoading(true);
      try {
        const response = await fetch(documentUrl);
        const text = await response.text();
        setHtmlContent(text);
      } catch (err) {
        setError("Failed to load document");
      } finally {
        setLoading(false);
      }
    };
    fetchDocument();
  }, [documentUrl]);

  // 2. Render checks
  if (loading) return <p>Loading document...</p>;
  if (error) return <p>{error}</p>;
  if (!htmlContent) return <p>No document to display.</p>;

  // 3. Capture editor changes
  const handleEditorChange = (value) => {
    setHtmlContent(value || "");
  };

  // 4. Format the document automatically once the editor mounts
  const handleEditorDidMount = (editor, monaco) => {
    // Wait a tick to ensure content is loaded, then format:
    setTimeout(() => {
      editor.getAction("editor.action.formatDocument").run();
    }, 50);
  };

  // 5. Save to parent
  const handleSave = () => {
    onSave(htmlContent);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Save button at top */}
      <div className="flex justify-end mb-2">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Save
        </button>
      </div>

      {/* Container for editor & preview side-by-side */}
      <div className="flex-1 flex space-x-4" style={{ minHeight: "600px" }}>
        {/* Editor Section */}
        <div className="w-1/2 border rounded">
          <Editor
            height="100%"
            defaultLanguage="html"
            value={htmlContent}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
            }}
          />
        </div>

        {/* Preview Section */}
        <div className="w-1/2 border rounded bg-white">
          {/* Render the HTML in an iframe for a clean, sandboxed preview */}
          <iframe
            title="Document Preview"
            className="w-full h-full"
            srcDoc={htmlContent}
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;
