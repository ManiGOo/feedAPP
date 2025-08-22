// src/pages/Following.jsx
import { useEffect, useState } from "react";
import PostCard from "../components/PostCard";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext.jsx";

export default function Following() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchPosts = async () => {
      try {
        const res = await api.get("/following-feed", {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        });
        setPosts(res.data);
      } catch (err) {
        console.error("Failed to fetch following posts:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user]);

  if (authLoading || loading)
    return <p className="text-center mt-10 text-gray-700 dark:text-gray-300">Loading posts...</p>;

  return (
    <div className="ml-0 md:ml-64 pt-20 max-w-2xl mx-auto px-4 space-y-4">
      {posts.length === 0 ? (
        <p className="text-gray-700 dark:text-gray-300">No posts from followed users yet.</p>
      ) : (
        posts.map((post) => <PostCard key={post.id} {...post} />)
      )}
    </div>
  );
}
