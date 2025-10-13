import React from "react";

export default function Avatar({ user }) {
  console.log("Avatar: Rendering for user:", user);
  return (
    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
      {user.avatar_url ? (
        <img
          src={user.avatar_url}
          alt={user.username}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-white text-xs">
          {user.username?.[0]?.toUpperCase() || "?"}
        </span>
      )}
    </div>
  );
}