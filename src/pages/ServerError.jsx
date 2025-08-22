// src/pages/ServerError.jsx
import { Link } from "react-router-dom";

export default function ServerError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors">
      <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4">500</h1>
      <p className="text-gray-700 dark:text-gray-300 mb-6">
        Something went wrong on our side.
      </p>
      <Link
        to="/"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}
