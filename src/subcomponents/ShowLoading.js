import { ActivityIcon } from "lucide-react";

export const ShowLoading = () => {
  return (
    <div className="flex p-4 bg-white">
      <div className="w-10 h-10 mr-4 rounded-full bg-green-500 flex items-center justify-center">
        <ActivityIcon className="text-white" size={20} />
      </div>
      <div className="flex-1">
        <p className="text-gray-500 animate-pulse">Typing...</p>
      </div>
    </div>
  );
};
