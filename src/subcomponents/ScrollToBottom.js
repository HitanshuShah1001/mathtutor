import { ChevronDownIcon } from "lucide-react";

export const ScrollToBottom = ({ isScrolledUp,scrollToBottom }) => {
  if (isScrolledUp) {
    return (
      <button
        onClick={scrollToBottom}
        className="fixed bottom-20 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 z-50"
      >
        <ChevronDownIcon size={24} />
      </button>
    );
  } else {
    return null;
  }
};
