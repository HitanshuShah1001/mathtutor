export const OptionalActionButton = ({ onClick, title }) => {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded shadow-md"
      style={{ backgroundColor: "black", color: "white" }}
    >
      {title}
    </button>
  );
};
