// src/components/PostCard.jsx
import { useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

function PostCard({ id, author, avatar_url, content, like_count, liked_by_me }) {
  const { user } = useAuth(); // Get current user from context
  const [likes, setLikes] = useState(like_count || 0);
  const [liked, setLiked] = useState(!!liked_by_me);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  const avatarLetter = author ? author[0].toUpperCase() : "U";

  // Like / Unlike a post
  const handleLike = async () => {
    if (!user) return; // prevent action if no logged-in user
    try {
      const res = await api.post(
        `/posts/${id}/like`,
        {},
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );
      setLiked(res.data.liked);
      setLikes((prev) => prev + (res.data.liked ? 1 : -1));
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
    if (!user || !newComment.trim()) return; // require user & non-empty comment
    try {
      const res = await api.post(
        `/posts/${id}/comments`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );
      setComments((prev) => [...prev, res.data]);
      setNewComment("");
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const toggleComments = () => {
    setShowComments((prev) => !prev);
    if (!showComments) fetchComments();
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl p-4 mb-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-500 text-white flex items-center justify-center rounded-full font-bold">
          {avatar_url ? (
            <img src={avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
          ) : (
            avatarLetter
          )}
        </div>
        <p className="font-semibold text-gray-800 dark:text-gray-200">{author || "Unknown"}</p>
      </div>

      <p className="mt-3 text-gray-700 dark:text-gray-300">{content}</p>

      <div className="mt-3 flex space-x-6 text-gray-500 dark:text-gray-400 text-sm">
        <button
          onClick={handleLike}
          className={`hover:text-blue-600 ${liked ? "text-blue-600 font-semibold" : ""}`}
          disabled={!user} // disable if not logged in
        >
          👍 {likes}
        </button>
        <button
          onClick={toggleComments}
          className="hover:text-blue-600"
          disabled={!user} // disable if not logged in
        >
          💬 Comment
        </button>
        <button className="hover:text-blue-600">🔁 Repost</button>
      </div>

      {showComments && (
        <div className="mt-3 space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="flex space-x-2 items-start">
              <div className="w-8 h-8 bg-gray-300 rounded-full overflow-hidden">
                {c.avatar_url ? (
                  <img src={c.avatar_url} alt="avatar" className="w-full h-full object-cover" />
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

          <div className="flex mt-2 space-x-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={user ? "Add a comment..." : "Login to comment"}
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-full px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
