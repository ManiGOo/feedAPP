// src/components/PostCard.jsx
import { useState, useRef, useEffect } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Heart, MessageCircle, Repeat2 } from "lucide-react";

function PostCard({
  id,
  author,
  avatar_url,
  content,
  like_count,
  liked_by_me,
  image = null,
  video = null,
}) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(like_count || 0);
  const [liked, setLiked] = useState(!!liked_by_me);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const inputRef = useRef(null);

  const avatarLetter = author ? author[0].toUpperCase() : "U";

  // Like / Unlike
  const handleLike = async () => {
    if (!user) return;
    try {
      const res = await api.post(
        `/posts/${id}/like`,
        {},
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );
      setLiked(res.data.liked);
      setLikes(prev => prev + (res.data.liked ? 1 : -1));
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  // Fetch comments
  const fetchComments = async () => {
    try {
      const res = await api.get(`/posts/${id}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    }
  };

  // Add new comment
  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;
    try {
      const res = await api.post(
        `/posts/${id}/comments`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );
      setComments(prev => [...prev, res.data]);
      setNewComment("");
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const toggleComments = () => {
    setShowComments(prev => !prev);
    if (!showComments) fetchComments();
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = inputRef.current.scrollHeight + "px";
    }
  }, [newComment]);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl p-4 mb-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition">

      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-500 text-white flex items-center justify-center rounded-full font-bold overflow-hidden">
          {avatar_url ? (
            <img
              src={avatar_url}
              alt="avatar"
              className="w-full h-full rounded-full object-cover"
            />
          ) : avatarLetter}
        </div>
        <p className="font-semibold text-gray-800 dark:text-gray-200">{author || "Unknown"}</p>
      </div>

      {/* Post content */}
      <p className="mt-3 text-gray-700 dark:text-gray-300">{content}</p>

      {/* Media */}
      {image && (
        <div className="mt-3 w-full rounded-lg overflow-hidden shadow-sm">
          <img
            src={image}
            alt="post media"
            className="w-full object-cover max-h-[500px] sm:max-h-[400px]"
          />
        </div>
      )}
      {video && (
        <div className="mt-3 w-full rounded-lg overflow-hidden shadow-sm relative">
          <video
            src={video}
            controls
            className="w-full h-auto max-h-[500px] sm:max-h-[400px] object-cover rounded-lg"
            poster="" // optional: you can set a thumbnail here
          />
          {/* Optional overlay play button if you want custom styling */}
          {/* <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-6.24-3.6A1 1 0 007 8.384v7.232a1 1 0 001.512.848l6.24-3.6a1 1 0 000-1.696z" />
          </svg>
          </div> */}
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex space-x-6 text-gray-500 dark:text-gray-400 text-sm">
        <button
          onClick={handleLike}
          className={`flex items-center space-x-1 hover:text-red-500 transition ${liked ? "text-red-500" : ""
            }`}
          disabled={!user}
        >
          <Heart size={18} className={liked ? "fill-current" : ""} />
          <span>{likes}</span>
        </button>

        <button
          onClick={toggleComments}
          className="flex items-center space-x-1 hover:text-blue-600 transition"
          disabled={!user}
        >
          <MessageCircle size={18} />
          <span>Comment</span>
        </button>

        <button className="flex items-center space-x-1 hover:text-green-600 transition">
          <Repeat2 size={18} />
          <span>Repost</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-3 space-y-2">
          {comments.map(c => (
            <div key={c.id} className="flex space-x-2 items-start">
              <div className="w-8 h-8 bg-gray-300 rounded-full overflow-hidden">
                {c.avatar_url ? (
                  <img
                    src={c.avatar_url}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-500 flex items-center justify-center h-full w-full text-sm">
                    {c.username[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold">{c.username}</p>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{c.content}</p>
              </div>
            </div>
          ))}

          {/* Add comment */}
          <div className="flex mt-2 space-x-2">
            <textarea
              ref={inputRef}
              rows={1}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={user ? "Add a comment..." : "Login to comment"}
              className="flex-1 resize-none border border-gray-300 dark:border-gray-600 rounded-full px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-transparent overflow-hidden"
              disabled={!user}
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim() || !user}
              className="bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostCard;
