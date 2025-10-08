import { useState, useEffect } from "react";
import { Save, X, Trash2 } from "lucide-react";

export default function EditProfileForm({ user, onCancel, onSave }) {
  const [formData, setFormData] = useState({
    username: user.username || "",
    email: user.email || "",
    bio: user.bio || "",
    avatarFile: null,
    removeAvatar: false,
  });

  const [previewUrl, setPreviewUrl] = useState(user.avatar_url || null);

  // Update preview immediately when avatarFile changes
  useEffect(() => {
    if (formData.avatarFile) {
      const url = URL.createObjectURL(formData.avatarFile);
      setPreviewUrl(url);

      // Clean up object URL to prevent memory leaks
      return () => URL.revokeObjectURL(url);
    } else if (formData.removeAvatar) {
      setPreviewUrl(null);
    } else {
      setPreviewUrl(user.avatar_url || null);
    }
  }, [formData.avatarFile, formData.removeAvatar, user.avatar_url]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleRemoveAvatar = () => {
    setFormData({ ...formData, avatarFile: null, removeAvatar: true });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 w-full bg-white dark:bg-gray-900 shadow-md rounded-2xl p-6 space-y-4"
    >
      {/* Username */}
      <div>
        <label className="block text-sm font-medium mb-1">Username</label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
          }
          className="w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-800"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          className="w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-800"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium mb-1">Bio</label>
        <textarea
          rows="3"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-800"
        />
      </div>

      {/* Avatar Upload */}
      <div>
        <label className="block text-sm font-medium mb-1">Profile Picture</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setFormData({
              ...formData,
              avatarFile: e.target.files[0],
              removeAvatar: false,
            })
          }
          className="block w-full text-sm text-gray-500 cursor-pointer"
        />

        {/* Live Preview */}
        {previewUrl && (
          <div className="mt-2 w-24 h-24 rounded-full overflow-hidden border border-gray-300">
            <img
              src={previewUrl}
              alt="Avatar preview"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Remove current avatar */}
        {(previewUrl || user.avatar_url) && (
          <button
            type="button"
            onClick={handleRemoveAvatar}
            className="mt-2 flex items-center gap-1 text-red-600 hover:text-red-800 text-sm"
          >
            <Trash2 size={14} /> Remove avatar
          </button>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-1 hover:bg-blue-700"
        >
          <Save size={16} /> Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg flex items-center justify-center gap-1"
        >
          <X size={16} /> Cancel
        </button>
      </div>
    </form>
  );
}
