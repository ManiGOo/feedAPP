import React from "react";
import { Search } from "lucide-react";
import { useMessageContext } from "../context/MessageContext.jsx";

function SearchResults({ results, loading, startDM }) {
  const { userSearchTerm, setUserSearchTerm } = useMessageContext();

  return (
    <div className="p-3 border-b dark:border-gray-700">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
        />
        <input
          type="text"
          placeholder="Search users..."
          value={userSearchTerm}
          onChange={(e) => setUserSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-blue-500"></div>
        </div>
      ) : results.length > 0 ? (
        <div className="mt-2 space-y-1">
          {results.map((user) => (
            <div
              key={user.id}
              className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              onClick={() => startDM(user)}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={`${user.username}'s avatar`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/32";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-medium">
                    {user.username ? user.username[0].toUpperCase() : "?"}
                  </div>
                )}
              </div>
              <p className="ml-2 text-sm text-gray-900 dark:text-gray-100 truncate">
                {user.username || "Unknown"}
              </p>
            </div>
          ))}
        </div>
      ) : userSearchTerm ? (
        <p className="text-gray-500 text-sm italic mt-2">No users found</p>
      ) : null}
    </div>
  );
}

export default React.memo(SearchResults);