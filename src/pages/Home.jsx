import { useEffect, useState } from "react";
import PostCard from "../components/PostCard";
import CreatePost from "./CreatePost";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext.jsx";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchPosts = async () => {
      try {
        const res = await api.get("/posts", {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        });

        // Attach user info to posts if missing
        const updatedPosts = res.data.map((p) => ({
          ...p,
          author: p.author || user.username,
          avatar_url: p.avatar_url || user.avatar_url || null,
        }));

        // Newest posts first
        setPosts(updatedPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      } catch (err) {
        console.error("Failed to fetch posts", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user]);

  const handleNewPost = (newPost) => {
    // Ensure new post has current user's info
    const postWithUser = {
      ...newPost,
      author: newPost.author || user.username,
      avatar_url: newPost.avatar_url || user.avatar_url || null,
      like_count: 0,
      liked_by_me: false,
    };
    setPosts((prev) => [postWithUser, ...prev]);
  };

  if (authLoading || loading)
    return (
      <p className="text-center text-gray-700 dark:text-gray-300 mt-10">
        Loading posts...
      </p>
    );

  return (
    <div className="ml-0 md:ml-64 pt-20 max-w-2xl mx-auto px-4 space-y-4">
      <CreatePost onNewPost={handleNewPost} />
      {posts.length === 0 ? (
        <p className="text-gray-700 dark:text-gray-300">No posts yet. Be the first to post!</p>
      ) : (
        posts.map((post) => <PostCard key={post.id} {...post} />)
      )}
    </div>
  );
}
