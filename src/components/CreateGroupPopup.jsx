import React, { useState, useRef } from "react";
import { X, Image, Check } from "lucide-react";
import api from "../utils/api.js";

export default function CreateGroupPopup({ onClose, onGroupCreated, availableMembers }) {
  const [name, setName] = useState("");
  const [memberIds, setMemberIds] = useState([]);
  const [avatar, setAvatar] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Group name is required");
      return;
    }
    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      setError("At least one member is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Debug FormData
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("memberIds", JSON.stringify(memberIds));
      if (avatar) formData.append("avatar", avatar);
      
      // Log FormData entries for debugging
      for (const [key, value] of formData.entries()) {
        console.log(`FormData ${key}:`, value);
      }

      const group = await api.createGroup({ name, memberIds, avatar });
      onGroupCreated(group);
      onClose();
    } catch (err) {
      console.error("Create group error:", err);
      setError(err.response?.data?.error || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Avatar file size must be under 5MB");
        return;
      }
      setAvatar(file);
    }
  };

  const toggleMember = (userId) => {
    setMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4 animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-gray-950 rounded-2xl shadow-xl p-6 space-y-4 transform transition-all duration-300 scale-100 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create New Group</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/50 p-2 rounded-lg animate-fade-in">
            {error}
          </p>
        )}

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group Name"
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />

        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          >
            <Image size={18} />
            {avatar ? "Change Avatar" : "Add Group Avatar"}
          </button>
          {avatar && (
            <div className="flex items-center gap-2">
              <img
                src={URL.createObjectURL(avatar)}
                alt="Avatar Preview"
                className="w-10 h-10 rounded-full object-cover"
              />
              <span className="text-sm text-gray-500 truncate">{avatar.name}</span>
            </div>
          )}
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Select Members</p>
          {availableMembers.length ? (
            availableMembers.map((u) => (
              <label
                key={u.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={memberIds.includes(u.id)}
                  onChange={() => toggleMember(u.id)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <img
                  src={u.avatar_url || "/default-avatar.png"}
                  alt={u.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className="text-gray-800 dark:text-gray-100 truncate font-medium">{u.username}</span>
                {memberIds.includes(u.id) && <Check size={16} className="ml-auto text-green-500" />}
              </label>
            ))
          ) : (
            <p className="text-gray-500 text-sm italic">Follow users to add them</p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !name.trim() || memberIds.length === 0}
          className="w-full py-2 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
          ) : (
            "Create Group"
          )}
        </button>
      </div>
    </div>
  );
}