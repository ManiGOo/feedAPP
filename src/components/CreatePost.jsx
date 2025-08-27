import { useState, useRef, useEffect } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext.jsx";

export default function CreatePost({ onNewPost }) {
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const inputRef = useRef(null);

  // File selection & preview
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);

    if (selected) {
      const url = URL.createObjectURL(selected);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !file) return;
    if (!user) return;

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("content", content);

      if (file) {
        const fieldName = file.type.startsWith("video/") ? "video" : "image";
        formData.append(fieldName, file);
      }

      const res = await api.post("/posts", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      onNewPost?.(res.data); // update feed
      setContent("");
      handleRemoveFile();
    } catch (err) {
      console.error("Failed to create post", err.response?.data || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = inputRef.current.scrollHeight + "px";
    }
  }, [content]);

  // Cleanup preview URL
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  return (
    <div className="bg-white dark:bg-gray-900 shadow-md rounded-xl p-6 transition-colors mb-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          ref={inputRef}
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full p-3 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden"
        />

        {/* File upload */}
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-medium
            file:bg-blue-50 file:text-blue-600
            hover:file:bg-blue-100 cursor-pointer"
        />

        {/* Preview */}
        {preview && (
          <div className="relative mt-3">
            {file.type.startsWith("image/") ? (
              <img src={preview} alt="preview" className="max-h-60 w-full object-contain rounded-lg" />
            ) : (
              <video src={preview} controls className="max-h-60 w-full rounded-lg" />
            )}
            <button
              type="button"
              onClick={handleRemoveFile}
              className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full hover:bg-red-600"
            >
              Remove
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || (!content.trim() && !file)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {submitting ? "Posting..." : "Post"}
        </button>
      </form>
    </div>
  );
}
