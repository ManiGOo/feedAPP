// pages/EditPost.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import api from "../utils/api";
import Loader from "../components/Loader";

export default function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState(""); // preview URL
  const [mediaType, setMediaType] = useState(null); // "image" | "video" | null
  const [originalMediaUrl, setOriginalMediaUrl] = useState(""); // from API
  const [newFile, setNewFile] = useState(null);
  const [removingMedia, setRemovingMedia] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch post
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await api.getPostById(id);
        setPost(data);
        setContent(data.content || "");
        if (data.media_url) {
          setOriginalMediaUrl(data.media_url);
          setMediaUrl(data.media_url);
          setMediaType(data.media_type);
        }
      } catch (err) {
        console.error("Failed to load post:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewFile(file);
    setMediaUrl(URL.createObjectURL(file));
    setMediaType(file.type.startsWith("video/") ? "video" : "image");
    setRemovingMedia(false); // reset if previously removed
  };

  const handleRemoveMedia = () => {
    setRemovingMedia(true);
    setMediaUrl("");
    setMediaType(null);
    setNewFile(null);
    URL.revokeObjectURL(mediaUrl); // clean up preview
  };

  const handleSubmit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("content", content);

      // Case 1: User removed original media
      if (originalMediaUrl && removingMedia) {
        formData.append("removeMedia", "true");
      }

      // Case 2: User uploaded new file
      if (newFile) {
        const key = newFile.type.startsWith("video/") ? "video" : "image";
        formData.append(key, newFile);
      }

      await api.put(`/posts/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate(`/post/${id}`);
    } catch (err) {
        console.error("Failed to update post:", err);
        alert("Failed to update post. Try again later.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader size={50} color="#3b82f6" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500">Post not found.</p>
      </div>
    );
  }

  const hasMedia = mediaUrl && !removingMedia;

  return (
    <div className="min-h-screen flex flex-col items-center pt-20 pb-10 px-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 w-full max-w-2xl shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Edit Post
        </h2>

        {/* MEDIA SECTION */}
        {hasMedia ? (
          <div className="relative mb-4">
            <button
              onClick={handleRemoveMedia}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition z-10"
            >
              <X size={18} />
            </button>
            {mediaType === "image" ? (
              <img
                src={mediaUrl}
                alt="Post"
                className="w-full rounded-xl object-cover max-h-[400px] border border-gray-200 dark:border-gray-700"
              />
            ) : (
              <video
                src={mediaUrl}
                controls
                className="w-full rounded-xl object-cover max-h-[400px] border border-gray-200 dark:border-gray-700"
              />
            )}
          </div>
        ) : (
          <div className="mb-4 border border-dashed border-gray-400 dark:border-gray-600 rounded-xl p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-3">
              {originalMediaUrl ? "Upload new image or video" : "Add image or video"}
            </p>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition">
                Choose File
              </div>
            </label>
            <p className="text-xs text-gray-400 mt-2">
              Max 50MB • MP4, MOV, JPG, PNG
            </p>
          </div>
        )}

        {/* TEXTAREA */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-40 p-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Edit your post content..."
        />

        {/* BUTTONS */}
        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className={`px-4 py-2 rounded-lg text-white font-medium transition ${
              saving
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {saving ? "Saving..." : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}