// src/pages/Profile.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PostCard from "../components/PostCard";
import api from "../utils/api";
import { Edit3, User } from "lucide-react";
import ButtomNav from "../components/ButtomNav.jsx";
import EditProfileForm from "../components/EditProfileForm.jsx";
import Loader from "../components/Loader.jsx";
import { useAuth } from "../context/AuthContext";

function Profile() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [user, setUser] = useState(null); // ✅ null to show loader first
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  const isOwnProfile = !id || id === currentUser?.id;

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const endpoint = isOwnProfile ? "/users/me" : `/users/profile/${id}`;
      const res = await api.get(endpoint);
      const userData = res.data.user;

      // Ensure follower/following counts exist
      userData.followersCount = userData.followersCount ?? 0;
      userData.followingCount = userData.followingCount ?? 0;

      setUser(userData);

      if (!isOwnProfile && currentUser) {
        setFollowing(userData.isFollowedByMe || false);
      }

      const userPosts = res.data.posts.map((p) => ({
        ...p,
        author: p.author || userData.username,
        avatar_url: p.avatar_url || userData.avatar_url || null,
        image: p.media_type === "image" ? p.media_url : null,
        video: p.media_type === "video" ? p.media_url : null,
        commentsNumber: p.comments_count || 0,
      }));

      setPosts(userPosts);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setMessage("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const handleUpdate = async (formData) => {
    try {
      if (formData.avatarFile) {
        const uploadData = new FormData();
        uploadData.append("avatar", formData.avatarFile);
        const resAvatar = await api.post("/users/me/avatar", uploadData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setUser(resAvatar.data.user);
        setEditing(false);
        setMessage("Profile updated with new avatar!");
        setTimeout(() => setMessage(""), 2000);
        return;
      }

      const res = await api.put("/users/me", formData);
      setUser(res.data.user);
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
      const res = await api.post(`/follow/toggle/${user.id}`);
      setFollowing(res.data.isFollowing);

      // Update follower count optimistically
      setUser((prev) => ({
        ...prev,
        followersCount: res.data.isFollowing
          ? prev.followersCount + 1
          : prev.followersCount - 1,
      }));
    } catch (err) {
      console.error("Follow/unfollow failed:", err);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader size={50} color="#3b82f6" />
      </div>
    );
  }

  return (
    <div className="pt-20 max-w-2xl mx-auto px-4 pb-20">
      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-500 flex items-center justify-center">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-12 h-12 text-gray-400" />
          )}
        </div>

        {isOwnProfile && editing ? (
          <EditProfileForm
            user={user}
            onCancel={() => setEditing(false)}
            onSave={handleUpdate}
          />
        ) : (
          <div className="text-center mt-6">
            <h2 className="text-xl font-bold">{user.username}</h2>
            <p className="text-gray-500">{user.email}</p>
            <p className="text-gray-600 dark:text-gray-400">{user.bio}</p>

            {/* Followers / Following */}
            <div className="flex justify-center gap-4 mt-2 text-sm text-gray-700 dark:text-gray-300">
              <span
                className="cursor-pointer hover:underline"
                onClick={() => navigate(`/follow/followers/${user.id}`)}
              >
                {user.followersCount} Followers
              </span>
              <span
                className="cursor-pointer hover:underline"
                onClick={() => navigate(`/follow/following/${user.id}`)}
              >
                {user.followingCount} Following
              </span>
            </div>

            {/* Edit or Follow Button */}
            {isOwnProfile ? (
              <div className="flex justify-center">
                <button
                  onClick={() => setEditing(true)}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-1 hover:bg-blue-700 transition-all duration-200"
                >
                  <Edit3 size={16} /> Edit Profile
                </button>
              </div>
            ) : (
              <div className="flex justify-center">
                <button
                  onClick={toggleFollow}
                  className={`mt-4 px-4 py-2 rounded-lg font-medium ${
                    following
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  {following ? "Following" : "Follow"}
                </button>
              </div>
            )}
          </div>
        )}

        {message && <p className="text-sm text-green-600 mt-3">{message}</p>}
      </div>

      {/* Posts */}
      <div className="mt-6 space-y-4">
        <h3 className="font-semibold text-lg">
          {isOwnProfile ? "Your Posts" : `${user.username}'s Posts`}
        </h3>

        {posts.length > 0 ? (
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
        )}
      </div>

      <ButtomNav />
    </div>
  );
}

export default Profile;
