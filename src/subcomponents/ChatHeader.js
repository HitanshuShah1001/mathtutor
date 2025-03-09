import { useContext } from "react";
import { Link, useLocation } from "react-router-dom"; // Import useLocation
import ProfileMenu from "./ProfileMenu";
import { AuthContext } from "../utils/AuthContext";

export const ChatHeader = ({ title }) => {
  const { selectedChat } = useContext(AuthContext);
  const location = useLocation(); // Get the current location

  // Check if the current route is /question-paper-generation
  const isQuestionPaperPage =
    location.pathname === "/question-paper-generation";

  return (
    <div
      className="flex justify-between items-center p-4 border-b border-gray-200"
      style={{ backgroundColor: "white" }}
    >
      <h2 className="text-xl font-semibold text-gray-800">
        {selectedChat ? selectedChat.title : title ?? "New chat"}
      </h2>
      <div className="flex items-center space-x-4">
        {/* Conditionally render the appropriate link */}
        {isQuestionPaperPage ? (
          <>
            <Link
              to="/question-paper-list"
              className="text-blue-500 hover:underline"
            >
              Question Papers
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/select-standard-and-file"
              className="text-blue-500 hover:underline"
            >
              Analyse Reports
            </Link>
            <Link
              to="/question-paper-generation"
              className="text-blue-500 hover:underline"
            >
              Question Paper Generation
            </Link>
          </>
        )}
        <ProfileMenu />
      </div>
    </div>
  );
};
