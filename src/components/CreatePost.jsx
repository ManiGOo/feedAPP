import { useState } from "react";
import { X, Image, Video, Send, Repeat2 } from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function CreatePost({
  onNewPost,
  repostTarget = null,
  onCloseRepost,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!content.trim() && !file) return;
    setLoading(true);
    try {
      const data = { content };
      if (file) data[file.type.startsWith("video/") ? "video" : "image"] = file;
      if (repostTarget) data.quote_from = repostTarget.id;

      const post = await api.createPost(data);   // <-- backend returns full post
      onNewPost(post);
      reset();
    } catch (err) {
      console.error("Post failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setContent("");
    setFile(null);
    setPreview(null);
    onCloseRepost?.();
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      {/* REPOST BANNER AT TOP */}
      {repostTarget && (
        <div className="px-4 pt-3 pb-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <Repeat2 size={14} />
          <span
            className="hover:underline cursor-pointer font-medium"
            onClick={() => navigate(`/profile/${repostTarget.author_id}`)}
          >
            {repostTarget.author}
          </span>
          <span>reposted</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCloseRepost();
            }}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* MAIN COMPOSER */}
      <div className="px-4 pb-3">
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-6 h-6 bg-gray-400 rounded-full" />
                </div>
              )}
            </div>
          </div>

          {/* Textarea */}
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={repostTarget ? "Add a comment..." : "What's happening?"}
              className="w-full bg-transparent text-[15px] text-gray-900 dark:text-gray-100 placeholder-gray-500 resize-none focus:outline-none"
              rows={repostTarget ? 2 : 3}
            />
          </div>
        </div>

        {/* QUOTE PREVIEW */}
        {repostTarget && (
          <div
            className="mt-2 p-2.5 rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 cursor-pointer"
            onClick={() => navigate(`/post/${repostTarget.id}`)}
          >
            <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
              {repostTarget.content}
            </p>
            {repostTarget.image && (
              <img src={repostTarget.image} alt="" className="mt-2 rounded-lg max-h-32 w-full object-cover" />
            )}
            {repostTarget.video && (
              <video src={repostTarget.video} className="mt-2 rounded-lg max-h-32 w-full" />
            )}
          </div>
        )}

        {/* MEDIA PREVIEW */}
        {preview && (
          <div className="relative mt-3">
            {file?.type.startsWith("video/") ? (
              <video src={preview} controls className="w-full rounded-xl max-h-80 object-cover" />
            ) : (
              <img src={preview} alt="preview" className="w-full rounded-xl max-h-80 object-cover" />
            )}
            <button
              onClick={() => {
                setFile(null);
                setPreview(null);
              }}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-4">
            <label className="cursor-pointer text-blue-500 hover:text-blue-600">
              <Image size={20} />
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </label>
            <label className="cursor-pointer text-green-500 hover:text-green-600">
              <Video size={20} />
              <input type="file" accept="video/*" onChange={handleFile} className="hidden" />
            </label>
          </div>

          <button
            onClick={submit}
            disabled={loading || (!content.trim() && !file)}
            className="px-5 py-1.5 bg-blue-500 text-white rounded-full text-sm font-medium disabled:opacity-50 hover:bg-blue-600 transition flex items-center gap-1.5"
          >
            {loading ? "Posting..." : repostTarget ? "Quote" : "Post"}
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}