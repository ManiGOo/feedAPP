// src/components/EditProfileForm.jsx
import { useState } from "react";
import { Save, X } from "lucide-react";

export default function EditProfileForm({ user, onCancel, onSave }) {
  const [formData, setFormData] = useState({
    username: user.username || "",
    email: user.email || "",
    bio: user.bio || "",
    avatarFile: null,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 w-full bg-white dark:bg-gray-900 shadow-md rounded-2xl p-6 space-y-4"
    >
      {/* Username */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Username
        </label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
          }
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 
                     bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 
                     bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Bio
        </label>
        <textarea
          rows="3"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 
                     bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Avatar */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Profile Picture
        </label>
        <input
          type="file"
          accept="image/*,video/*"
          onChange={(e) =>
            setFormData({ ...formData, avatarFile: e.target.files[0] })
          }
          className="block w-full text-sm text-gray-500 
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-lg file:border-0
                     file:text-sm file:font-medium
                     file:bg-blue-50 file:text-blue-600
                     hover:file:bg-blue-100 cursor-pointer"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-1 
                     hover:bg-blue-700 transition-colors duration-200"
        >
          <Save size={16} /> Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                     px-4 py-2 rounded-lg flex items-center justify-center gap-1 
                     hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
        >
          <X size={16} /> Cancel
        </button>
      </div>
    </form>
  );
}
