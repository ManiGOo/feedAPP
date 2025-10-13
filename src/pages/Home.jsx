import { useEffect, useState } from "react";
import PostCard from "../components/PostCard";
import CreatePost from "../components/CreatePost.jsx";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext.jsx";
import GlobalBottomNav from "../components/GlobalBottomNav.jsx";
import Navbar from "../components/Navbar.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import Loader from "../components/Loader.jsx";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("forYou");
  const [showOverlay, setShowOverlay] = useState(false);

  const [tabHidden, setTabHidden] = useState(false);
  const [lastScroll, setLastScroll] = useState(0);

  const isLoading = authLoading || loading || !user;

  // Handle tab hide/show on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      if (currentScroll > lastScroll + 10) {
        setTabHidden(true); // scrolling down
      } else if (currentScroll < lastScroll - 10) {
        setTabHidden(false); // scrolling up
      }
      setLastScroll(currentScroll);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScroll]);

  // Fetch posts
  useEffect(() => {
    if (!user) return;
    const fetchPosts = async () => {
      try {
        const res = await api.get("/posts", {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        });
        const updatedPosts = res.data.map((p) => ({
          ...p,
          author: p.author || "Unknown",
          author_id: p.author_id,
          avatar_url: p.avatar_url || null,
          image: p.media_type === "image" ? p.media_url : null,
          video: p.media_type === "video" ? p.media_url : null,
          commentsNumber: p.comments_count || 0,
          isFollowedAuthor: !!p.is_followed_author,
        }));
        setPosts(updatedPosts);
      } catch (err) {
        console.error("Failed to fetch posts:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [user]);

  // Add new post
  const handleNewPost = (newPost) => {
    const postWithUser = {
      ...newPost,
      author: user.username,
      author_id: user.id,
      avatar_url: user.avatar_url || null,
      like_count: 0,
      liked_by_me: false,
      commentsNumber: 0,
      image: newPost.media_type === "image" ? newPost.media_url : null,
      video: newPost.media_type === "video" ? newPost.media_url : null,
      isFollowedAuthor: false,
    };
    setPosts((prev) => [postWithUser, ...prev]);
    setShowOverlay(false);
  };

  // Follow/unfollow toggle
  const handleFollowToggle = async (authorId) => {
    try {
      const res = await api.post(
        `/follow/toggle/${authorId}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } }
      );

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.author_id === authorId
            ? { ...post, isFollowedAuthor: res.data.isFollowing }
            : post
        )
      );
    } catch (err) {
      console.error("Failed to toggle follow:", err.response?.data || err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader size={50} color="#3b82f6" />
      </div>
    );
  }

  const filteredPosts =
    activeTab === "following" ? posts.filter((p) => p.isFollowedAuthor) : posts;

  return (
    <div className="pb-16 max-w-2xl mx-auto px-4 relative">
      {/* Top Navbar */}
      <Navbar />

      {/* For You / Following Tabs */}
      <motion.div
        className="flex justify-around border-b border-gray-200 dark:border-gray-700 sticky top-[72px] bg-white dark:bg-gray-900 z-40 shadow-sm"
        animate={{ y: tabHidden ? -80 : 0 }}
        transition={{ type: "tween", duration: 0.2 }}
      >
        <button
          onClick={() => setActiveTab("forYou")}
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === "forYou"
              ? "text-black dark:text-white border-b-2 border-blue-500"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          For You
        </button>
        <button
          onClick={() => setActiveTab("following")}
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === "following"
              ? "text-black dark:text-white border-b-2 border-blue-500"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          Following
        </button>
      </motion.div>

      {/* Feed */}
      <div className="pt-6 pb-24 space-y-6">
        {filteredPosts.length === 0 ? (
          <p className="text-gray-700 dark:text-gray-300 mt-8 text-center text-base">
            {activeTab === "following"
              ? "You’re not following anyone yet."
              : "No posts yet. Be the first to post!"}
          </p>
        ) : (
          filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              {...post}
              commentsNumber={post.commentsNumber}
              avatar_url={post.avatar_url || null}
              onFollowToggle={() => handleFollowToggle(post.author_id)}
            />
          ))
        )}

        {/* Spacer to prevent overlap with floating button and bottom nav */}
        <div className="h-24" />
      </div>

      {/* Floating + Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowOverlay(true)}
        className="fixed bottom-20 right-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg z-50"
      >
        <Plus size={28} />
      </motion.button>

      {/* Create Post Overlay */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-lg w-full shadow-xl relative"
            >
              <button
                onClick={() => setShowOverlay(false)}
                className="absolute top-3 right-3 text-gray-600 dark:text-gray-300 hover:text-red-500"
              >
                ✕
              </button>
              <CreatePost onNewPost={handleNewPost} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <GlobalBottomNav />
    </div>
  );
}
