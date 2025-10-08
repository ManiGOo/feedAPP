import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit3, User, X } from "lucide-react";

import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";
import PostCard from "../components/PostCard";
import CommentList from "../components/CommentList";
import EditProfileForm from "../components/EditProfileForm";
import ButtomNav from "../components/BottomNav";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";

export default function Profile() {
  const { id: paramId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const id = paramId || currentUser?.id;
  const isOwnProfile = id === currentUser?.id;

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [following, setFollowing] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("posts"); // posts | comments

  const fetchProfile = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const endpoint = isOwnProfile ? "/users/me" : `/users/profile/${id}`;
      const res = await api.get(endpoint);
      const userData = res.data.user;

      userData.followersCount = userData.followersCount ?? 0;
      userData.followingCount = userData.followingCount ?? 0;
      setProfile(userData);
      if (!isOwnProfile) setFollowing(userData.isFollowedByMe || false);

      // Map posts to PostCard structure
      const userPosts = (res.data.posts || []).map((p) => ({
        ...p,
        author: p.author || userData.username,
        avatar_url: p.avatar_url || userData.avatar_url || null,
        commentsNumber: p.comments?.length || 0,
        image: p.media_type === "image" ? p.media_url : null,
        video: p.media_type === "video" ? p.media_url : null,
        comments: p.comments || [],
      }));

      setPosts(userPosts);
    } catch (err) {
      console.error("Failed to load profile:", err);
      setMessage("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch only current user's comments safely
  const fetchMyComments = async () => {
    if (!currentUser) return; // don't fetch if user not ready
    setLoading(true);
    try {
      const res = await api.get("/comments/me");
      setComments(res.data || []);
    } catch (err) {
      if (err.response?.status === 403) {
        console.warn("Access forbidden: cannot fetch comments");
        setMessage("You are not allowed to view comments.");
      } else {
        console.error("Failed to fetch comments:", err);
        setMessage("Failed to load comments.");
      }
      setComments([]); // prevent old data from showing
    } finally {
      setLoading(false);
    }
  };

  // --- useEffect for comments tab ---
  useEffect(() => {
    // Only fetch if "comments" tab active and user is logged in
    if (activeTab === "comments" && currentUser) {
      fetchMyComments();
    }
  }, [activeTab, currentUser]);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  useEffect(() => {
    if (activeTab === "comments") {
      fetchMyComments();
    }
  }, [activeTab]);

  const handleUpdate = async (formData) => {
    try {
      const uploadData = new FormData();
      if (formData.username) uploadData.append("username", formData.username);
      if (formData.email) uploadData.append("email", formData.email);
      if (formData.bio !== undefined) uploadData.append("bio", formData.bio);
      if (formData.avatarFile) uploadData.append("avatar", formData.avatarFile);
      else if (formData.removeAvatar) uploadData.append("removeAvatar", "true");

      const res = await api.put("/users/me", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setProfile(res.data.user);
      setEditing(false);
      setMessage("Profile updated!");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      console.error("Update failed:", err);
      setMessage("Update failed.");
    }
  };

  const toggleFollow = async () => {
    try {
      const res = await api.post(`/follow/toggle/${profile.id}`);
      setFollowing(res.data.isFollowing);
      setProfile((prev) => ({
        ...prev,
        followersCount: res.data.isFollowing
          ? prev.followersCount + 1
          : prev.followersCount - 1,
      }));
    } catch (err) {
      console.error("Follow/unfollow failed:", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  const handleUpdateComment = async (commentId, newContent) => {
    try {
      const res = await api.put(`/comments/${commentId}`, { content: newContent });
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, content: res.data.content } : c))
      );
    } catch (err) {
      console.error("Failed to update comment:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader size={50} color="#3b82f6" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500">Profile not found.</p>
      </div>
    );
  }

  return (
    <div className="pt-20 max-w-2xl mx-auto px-4 pb-20 relative">
      <Navbar />

      {/* Profile Card */}
      <div
        className={`bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 flex flex-col items-center transition-all ${editing ? "blur-sm pointer-events-none select-none" : ""
          }`}
      >
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-500 flex items-center justify-center">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-12 h-12 text-gray-400" />
          )}
        </div>

        <div className="text-center mt-6">
          <h2 className="text-xl font-bold">{profile.username}</h2>
          <p className="text-gray-500">{profile.email}</p>
          <p className="text-gray-600 dark:text-gray-400">{profile.bio}</p>

          <div className="flex justify-center gap-4 mt-2 text-sm text-gray-700 dark:text-gray-300">
            <span
              className="cursor-pointer hover:underline"
              onClick={() => navigate(`/follow/followers/${profile.id}`)}
            >
              {profile.followersCount} Followers
            </span>
            <span
              className="cursor-pointer hover:underline"
              onClick={() => navigate(`/follow/following/${profile.id}`)}
            >
              {profile.followingCount} Following
            </span>
          </div>

          {isOwnProfile ? (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setEditing(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-1 hover:bg-blue-700 transition-all duration-200"
              >
                <Edit3 size={16} /> Edit Profile
              </button>
            </div>
          ) : (
            <div className="flex justify-center mt-4">
              <button
                onClick={toggleFollow}
                className={`px-4 py-2 rounded-lg font-medium ${following
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
              >
                {following ? "Following" : "Follow"}
              </button>
            </div>
          )}
        </div>

        {message && <p className="text-sm text-green-600 mt-3">{message}</p>}
      </div>

      {/* Tabs */}
      <div className="mt-6 flex border-b border-gray-200 dark:border-gray-700">
        <button
          className={`flex-1 py-2 text-center font-medium ${activeTab === "posts"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500"
            }`}
          onClick={() => setActiveTab("posts")}
        >
          Posts
        </button>
        <button
          className={`flex-1 py-2 text-center font-medium ${activeTab === "comments"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500"
            }`}
          onClick={() => setActiveTab("comments")}
        >
          Comments
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-4 space-y-4">
        {activeTab === "posts" ? (
          posts.length > 0 ? (
            posts.map((post) => (
              <PostCard
                key={post.id}
                {...post}
                showDelete={isOwnProfile}
                onDelete={async (postId) => {
                  try {
                    await api.delete(`/posts/${postId}`);
                    setPosts((prev) => prev.filter((p) => p.id !== postId));
                  } catch (err) {
                    console.error("Failed to delete post:", err);
                  }
                }}
              />
            ))
          ) : (
            <p className="text-gray-500">No posts yet.</p>
          )
        ) : (
          <CommentList
            commentsData={comments}
            onDeleteComment={handleDeleteComment}
            onUpdateComment={handleUpdateComment}
          />
        )}
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {editing && (
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
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-xl relative"
            >
              <button
                onClick={() => setEditing(false)}
                className="absolute top-3 right-3 text-gray-600 dark:text-gray-300 hover:text-red-500"
              >
                <X size={20} />
              </button>
              <EditProfileForm
                user={profile}
                onCancel={() => setEditing(false)}
                onSave={handleUpdate}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ButtomNav />
    </div>
  );
}
