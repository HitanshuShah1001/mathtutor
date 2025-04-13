export const CustomLoader = ({ title = "Loading" }) => {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <p className="ml-4 text-gray-600">{title}</p>
    </div>
  );
};
