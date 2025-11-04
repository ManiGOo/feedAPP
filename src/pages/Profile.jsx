// pages/Profile.jsx
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Edit3,
  User,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";
import PostCard from "../components/PostCard";
import CommentList from "../components/CommentList";
import EditProfileForm from "../components/EditProfileForm";
import GlobalBottomNav from "../components/GlobalBottomNav.jsx";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import ClipItem from "../components/ClipItem.jsx";
import { ClipsProvider } from "../context/ClipsContext";

export default function Profile() {
  const { id: paramId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const id = paramId || currentUser?.id;
  const isOwnProfile = id === currentUser?.id;

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [clips, setClips] = useState([]);
  const [comments, setComments] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [following, setFollowing] = useState(false);

  const [toast, setToast] = useState({ message: "", type: "" });
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  const fetchProfile = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const endpoint = isOwnProfile ? "/users/me" : `/users/profile/${id}`;
      const res = await api.get(endpoint);
      const {
        user: userData,
        posts: rawPosts = [],
        clips: rawClips = [],
        comments: rawComments = [],
        bookmarks: rawBookmarks = [],
      } = res.data;

      const normalizedUser = {
        ...userData,
        followersCount: userData.followersCount ?? 0,
        followingCount: userData.followingCount ?? 0,
      };
      setProfile(normalizedUser);
      if (!isOwnProfile) setFollowing(userData.isFollowedByMe || false);

      const normalizePost = (p) => ({
        ...p,
        author: p.author || normalizedUser.username,
        author_avatar: p.author_avatar || normalizedUser.avatar_url,
        image: p.media_type === "image" ? p.media_url : null,
        video: p.media_type === "video" ? p.media_url : null,
        like_count: p.like_count || 0,
        liked_by_me: p.liked_by_me || false,
        repost_count: p.repost_count || 0,
        reposted_by_me: p.reposted_by_me || false,
        comments_count: p.comments_count || 0,
        bookmark_count: p.bookmark_count || 0,
        bookmarked_by_me: p.bookmarked_by_me || false,
      });

      setPosts(rawPosts.map(normalizePost));
      setClips(rawClips.map(normalizePost));
      setBookmarks(isOwnProfile ? rawBookmarks.map(normalizePost) : []);
      setComments(rawComments.map(c => ({
        ...c,
        username: c.username || normalizedUser.username,
        avatar_url: c.avatar_url || normalizedUser.avatar_url,
      })));
    } catch (err) {
      console.error("Failed to load profile:", err);
      showToast("Failed to load profile.", "error");
    } finally {
      setLoading(false);
    }
  }, [id, isOwnProfile]);

  const handleSearch = async (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const results = await api.searchUsers(query);
      setSearchResults(results);
    } catch (err) {
      showToast("Search failed.", "error");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleUpdate = async (formData) => {
    setUpdating(true);
    try {
      const res = await api.updateProfile(formData);
      setProfile(res.user);
      setEditing(false);
      showToast("Profile updated successfully!", "success");
      fetchProfile();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      showToast(`Update failed: ${errorMsg}`, "error");
    } finally {
      setUpdating(false);
    }
  };

  const toggleFollow = async () => {
    if (!profile) return;
    try {
      const res = await api.post(`/follow/toggle/${profile.id}`);
      setFollowing(res.data.isFollowing);
      setProfile(prev => ({
        ...prev,
        followersCount: res.data.isFollowing ? prev.followersCount + 1 : prev.followersCount - 1,
      }));
    } catch (err) {
      showToast("Failed to update follow status.", "error");
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments(prev => prev.filter(c => c.id !== commentId));
      showToast("Comment deleted.");
    } catch (err) {
      showToast("Failed to delete comment.", "error");
    }
  };

  const handleUpdateComment = async (commentId, newContent) => {
    try {
      const res = await api.put(`/comments/${commentId}`, { content: newContent });
      setComments(prev =>
        prev.map(c => c.id === commentId ? { ...c, content: res.data.content } : c)
      );
      showToast("Comment updated.");
    } catch (err) {
      showToast("Failed to update comment.", "error");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader size={50} color="#3b82f6" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-4 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-lg text-gray-600 dark:text-gray-400">Profile not found.</p>
      </div>
    );
  }

  const tabs = ["posts", "clips", "comments"];
  if (isOwnProfile) tabs.push("bookmarks");

  return (
    <ClipsProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 pb-24">
        <div className="max-w-2xl mx-auto px-4">
          <Navbar />

          {/* Search Bar */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={searchLoading}
                className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors disabled:opacity-50"
              >
                {searchLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Search"}
              </button>
            </form>

            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-3 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => {
                        navigate(`/profile/${user.id}`);
                        clearSearch();
                      }}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-blue-500">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{user.username}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {searchQuery && searchResults.length === 0 && !searchLoading && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-center text-gray-500 dark:text-gray-400">
                No users found.
              </motion.p>
            )}
          </motion.div>

          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 transition-all ${editing ? "blur-sm pointer-events-none" : ""}`}
          >
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <User className="w-14 h-14 text-white" />
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-5 text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.username}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{profile.email}</p>
                {profile.bio && (
                  <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-md mx-auto">{profile.bio}</p>
                )}
                <div className="flex justify-center gap-6 mt-4 text-sm">
                  <button
                    onClick={() => navigate(`/follow/followers/${profile.id}`)}
                    className="text-gray-700 dark:text-gray-300 hover:underline font-medium"
                  >
                    {profile.followersCount} <span className="text-gray-500">Followers</span>
                  </button>
                  <button
                    onClick={() => navigate(`/follow/following/${profile.id}`)}
                    className="text-gray-700 dark:text-gray-300 hover:underline font-medium"
                  >
                    {profile.followingCount} <span className="text-gray-500">Following</span>
                  </button>
                </div>
                <div className="mt-6">
                  {isOwnProfile ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Profile
                    </button>
                  ) : (
                    <button
                      onClick={toggleFollow}
                      disabled={updating}
                      className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                        following
                          ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray,600"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                        following ? "focus:ring-gray-500" : "focus:ring-blue-500"
                      }`}
                    >
                      {updating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : following ? "Following" : "Follow"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="mt-8 -mb-px flex border-b border-gray-200 dark:border-gray-800">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-center font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? "text-blue-600 dark:text-blue-500 border-b-2 border-blue-600 dark:border-blue-500"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {tab === "bookmarks" ? "Bookmarks" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="mt-6 space-y-4 pb-8">
            <AnimatePresence mode="wait">
              {activeTab === "posts" && (
                <motion.div key="posts" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  {posts.length > 0 ? (
                    posts.map((post) => (
                      <PostCard
                        key={post.id}
                        {...post}
                        showDelete={isOwnProfile}
                        onDelete={async (postId) => {
                          await api.deletePost(postId);
                          setPosts(prev => prev.filter(p => p.id !== postId));
                          showToast("Post deleted.");
                        }}
                        hideEdit={false}
                      />
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">No posts yet.</p>
                  )}
                </motion.div>
              )}

              {activeTab === "clips" && (
                <motion.div key="clips" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  {clips.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {clips.map((clip) => (
                        <div
                          key={clip.id}
                          className="aspect-[9/16] bg-black rounded-lg overflow-hidden cursor-pointer"
                          onClick={() => navigate(`/clips/${clip.id}`)}
                        >
                          <ClipItem clip={clip} isActive={false} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No clips yet.</p>
                  )}
                </motion.div>
              )}

              {activeTab === "comments" && (
                <motion.div key="comments" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <CommentList
                    commentsData={comments}
                    onDeleteComment={handleDeleteComment}
                    onUpdateComment={handleUpdateComment}
                    showDelete={isOwnProfile}
                    showPostContent={true}
                  />
                </motion.div>
              )}

              {activeTab === "bookmarks" && isOwnProfile && (
                <motion.div key="bookmarks" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  {bookmarks.length > 0 ? (
                    bookmarks.map((post) => (
                      <PostCard
                        key={post.id}
                        {...post}
                        showDelete={false}
                        hideEdit={true}
                      />
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">No bookmarked posts.</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Edit Modal */}
        <AnimatePresence>
          {editing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setEditing(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <EditProfileForm
                  user={profile}
                  onCancel={() => setEditing(false)}
                  onSave={handleUpdate}
                  isLoading={updating}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast */}
        <AnimatePresence>
          {toast.message && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
            >
              <div
                className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-lg text-white font-medium ${
                  toast.type === "success" ? "bg-green-600" : "bg-red-600"
                }`}
              >
                {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span>{toast.message}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <GlobalBottomNav />
      </div>
    </ClipsProvider>
  );
}