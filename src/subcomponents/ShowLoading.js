import { ActivityIcon } from "lucide-react";

export const ShowLoading = () => {
  return (
    <div className="flex gap-6 relative group px-6 py-8">
       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transform transition-transform duration-200 hover:scale-110 bg-gradient-to-br from-emerald-500 to-teal-600`}>
        <ActivityIcon className="text-white" size={24} />
      </div>
      <div className="text-gray-800">
        <p className="text-gray-500 animate-pulse">Typing...</p>
      </div>
    </div>
  );
};
