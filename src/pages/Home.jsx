import { useEffect, useState, useRef } from "react";
import PostCard from "../components/PostCard";
import CreatePost from "../components/CreatePost";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import GlobalBottomNav from "../components/GlobalBottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Loader2 } from "lucide-react";

const NAVBAR_HEIGHT = 56;

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("forYou");
  const [showCreate, setShowCreate] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  /* === FETCH POSTS === */
  useEffect(() => {
    if (!user) return;

    const fetchPosts = async () => {
      try {
        setLoading(true);
        const feed = tab === "following" ? "following" : null;
        const data = await api.getPosts(feed);

        const normalized = data.map((p) => ({
          ...p,
          image: p.media_type === "image" ? p.media_url : null,
          video: p.media_type === "video" ? p.media_url : null,
          like_count: p.like_count ?? 0,
          liked_by_me: p.liked_by_me ?? false,
          comments_count: p.comments_count ?? 0,
          repost_count: p.repost_count ?? 0,
          reposted_by_me: p.reposted_by_me ?? false,
          bookmark_count: p.bookmark_count ?? 0,
          bookmarked_by_me: p.bookmarked_by_me ?? false,
          isFollowedAuthor: p.is_followed_author ?? false,
        }));

        setPosts(normalized);
      } catch (err) {
        console.error("Failed to load posts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user, tab]);

  /* === HIDE/SHOW HEADER ON SCROLL === */
  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      const scrollingDown = current > lastScrollY.current;

      if (scrollingDown && current > 100) {
        setHeaderVisible(false);
      } else if (!scrollingDown && current < lastScrollY.current - 10) {
        setHeaderVisible(true);
      }

      lastScrollY.current = current;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* === HANDLE NEW POST === */
  const handleNewPost = (post) => {
    const newPost = {
      ...post,
      author: user.username,
      author_id: user.id,
      author_avatar: user.avatar_url,
      like_count: 0,
      liked_by_me: false,
      comments_count: 0,
      repost_count: 0,
      reposted_by_me: false,
      bookmark_count: 0,
      bookmarked_by_me: false,
      isFollowedAuthor: tab === "following",
      image: post.media_type === "image" ? post.media_url : null,
      video: post.media_type === "video" ? post.media_url : null,
    };
    setPosts((prev) => [newPost, ...prev]);
    setShowCreate(false);
  };

  /* === FOLLOW TOGGLE === */
  const handleFollowToggle = async (authorId) => {
    try {
      const res = await api.post(`/follow/toggle/${authorId}`);
      const isFollowing = res.data.isFollowing;

      setPosts((prev) =>
        prev.map((p) =>
          p.author_id === authorId
            ? { ...p, isFollowedAuthor: isFollowing }
            : p
        )
      );
    } catch (err) {
      console.error("Follow toggle failed:", err);
    }
  };

  /* === DELETE POST === */
  const handleDeletePost = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  /* === LOADING STATE === */
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-black">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-black ${showCreate ? "" : "pb-20"}`}>
      <Navbar />

      {/* === STICKY TABS === */}
      <motion.div
        animate={{ y: headerVisible ? 0 : -60 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800"
        style={{ top: NAVBAR_HEIGHT }}
      >
        <div className="flex">
          {["forYou", "following"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`
                flex-1 py-4 text-lg font-bold capitalize transition-all duration-200 relative
                ${tab === t ? "text-black dark:text-white" : "text-gray-500 dark:text-gray-400"}
              `}
            >
              {t === "forYou" ? "For you" : "Following"}
              {tab === t && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* === FEED === */}
      <div className="max-w-xl mx-auto mt-8"> {/* Added margin-top for spacing */}
        {posts.length === 0 ? (
          <div className="text-center py-20 px-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {tab === "following"
                ? "You’re not following anyone yet"
                : "Welcome to your timeline"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {tab === "following"
                ? "Follow people to see their posts here."
                : "Posts from people you follow will appear here."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                {...post}
                showDelete={post.author_id === user?.id}
                onDelete={handleDeletePost}
                onFollowToggle={() => handleFollowToggle(post.author_id)}
                hideEdit={true}
              />
            ))}
          </div>
        )}
        <div className="h-32" />
      </div>

      {/* === FLOATING + BUTTON === */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowCreate(true)}
        className="fixed bottom-20 right-4 bg-black dark:bg-white text-white dark:text-black rounded-full p-4 shadow-2xl z-50 flex items-center justify-center"
        style={{ width: 56, height: 56 }}
      >
        <Plus size={28} strokeWidth={3} />
      </motion.button>

      {/* === CREATE POST MODAL === */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white dark:bg-black w-full max-w-lg rounded-t-3xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => setShowCreate(false)}
                  className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full p-2"
                >
                  <X size={20} />
                </button>
                <span className="text-sm font-semibold text-blue-500">Draft</span>
                <div className="w-10" />
              </div>

              {/* CreatePost Form */}
              <div className="max-h-[70vh] overflow-y-auto">
                <CreatePost onNewPost={handleNewPost} onClose={() => setShowCreate(false)} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === BOTTOM NAV — HIDDEN WHEN MODAL IS OPEN === */}
      <AnimatePresence>
        {!showCreate && (
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-40"
          >
            <GlobalBottomNav />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}