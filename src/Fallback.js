import React from "react";

const ErrorPage = () => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-black">
            Something went wrong
          </h1>
          <p className="text-gray-600 text-lg">
            We're having trouble loading this page. Please try again.
          </p>
        </div>

        <div className="mt-12">
          <button
            onClick={handleReload}
            className="py-3 px-6 border-2 border-black dark:border-white text-black font-medium rounded-md bg-black text-white transition-all duration-200"
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
