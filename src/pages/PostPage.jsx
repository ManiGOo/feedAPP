import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";

function PostPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await api.get(`/posts/${id}`);
                setPost(res.data);
                setComments(res.data.comments || []);
            } catch (err) {
                console.error("Failed to fetch post:", err);
            }
        };
        fetchPost();
    }, [id]);

    const handleAddComment = async () => {
        if (!user || !newComment.trim()) return;
        try {
            const res = await api.post(
                `/posts/${id}/comments`,
                { content: newComment },
                { headers: { Authorization: `Bearer ${user.accessToken}` } }
            );
            setComments((prev) => [...prev, res.data]);
            setNewComment("");
            inputRef.current?.focus();
        } catch (err) {
            console.error("Failed to add comment:", err);
        }
    };

    if (!post) return <p className="text-center mt-6">Loading post...</p>;

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">

            {/* 🔙 Back Button */}
            <div className="pt-5">
                <div
                    onClick={() => navigate(-1)}
                    className="cursor-pointer bg-white dark:bg-gray-900 shadow-sm rounded-xl 
            p-3 flex items-center gap-2 text-gray-700 dark:text-gray-200 font-medium
            hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-md active:scale-95 
            transition-all duration-200"
                >
                    <ArrowLeft className="w-5 h-5 transition-transform duration-200" strokeWidth={2} />
                    <span>Back</span>
                </div>
            </div>

            {/* 📌 Post */}
            <PostCard
                id={post.id}
                author={post.author}
                avatar_url={post.avatar_url}
                content={post.content}
                like_count={post.like_count}
                liked_by_me={post.liked_by_me}
                image={post.media_type === "image" ? post.media_url : null}
                video={post.media_type === "video" ? post.media_url : null}
                hideCommentButton={false} // show the comment icon
                commentsNumber={comments.length} // ✅ pass current number
            />


            {/* 💬 Comments Section */}
            <div className="bg-white dark:bg-gray-900 shadow-md rounded-xl p-4">
                <h2 className="text-lg font-semibold mb-4">Comments</h2>

                {comments.length === 0 ? (
                    <p className="text-gray-500">No comments yet</p>
                ) : (
                    <div className="space-y-4">
                        {comments.map((c) => (
                            <div
                                key={c.id}
                                className="flex items-start gap-3 border-b border-gray-200 dark:border-gray-700 pb-3"
                            >
                                <img
                                    src={c.avatar_url || "/default-avatar.png"}
                                    alt={c.username || "User"}
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                                <div>
                                    <p className="font-semibold text-sm">
                                        {c.username || "Unknown"}
                                    </p>
                                    <p className="text-sm text-gray-800 dark:text-gray-200">
                                        {c.content}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ➕ Add Comment */}
                {user && (
                    <div className="flex gap-2 mt-4 items-start">
                        <textarea
                            ref={inputRef}
                            rows={1}
                            value={newComment}
                            onChange={(e) => {
                                setNewComment(e.target.value);
                                const el = e.target;
                                el.style.height = "auto";
                                el.style.height = el.scrollHeight + "px";
                            }}
                            placeholder="Add a comment..."
                            className="flex-1 resize-none border border-gray-300 dark:border-gray-700 rounded-2xl px-3 py-2 text-sm 
                focus:outline-none focus:ring-1 focus:ring-blue-500 bg-transparent text-gray-900 dark:text-gray-100 
                overflow-hidden transition-all duration-200 ease-in-out"
                        />
                        <button
                            onClick={handleAddComment}
                            disabled={!newComment.trim()}
                            className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-blue-700 disabled:opacity-50 self-end transition-colors"
                        >
                            Post
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PostPage;
