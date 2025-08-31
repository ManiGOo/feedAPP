// src/pages/Profile.jsx
import { useEffect, useState } from "react";
import PostCard from "../components/PostCard";
import api from "../utils/api";
import { Edit3, Trash2 } from "lucide-react";
import ButtomNav from "../components/ButtomNav.jsx";
import EditProfileForm from "../components/EditProfileForm.jsx";

function Profile() {
  const [user, setUser] = useState({});
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");

      // Fetch user
      const resUser = await api.get("/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = resUser.data?.user;
      setUser(userData);

      // Fetch posts
      const resPosts = await api.get("/posts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userPosts = resPosts.data
        .filter((p) => p.author_id === userData.id)
        .map((p) => ({
          ...p,
          author: p.author || userData.username,
          avatar_url: p.avatar_url || userData.avatar_url || null,
          image: p.media_type === "image" ? p.media_url : null,
          video: p.media_type === "video" ? p.media_url : null,
          commentsNumber: p.comments_count || 0, // <-- add this
        }));

      setPosts(userPosts);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setMessage("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (formData) => {
    try {
      const token = localStorage.getItem("accessToken");

      if (formData.avatarFile) {
        const uploadData = new FormData();
        uploadData.append("avatar", formData.avatarFile);

        const resAvatar = await api.post("/users/me/avatar", uploadData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        const updatedUser = resAvatar.data?.user;
        setUser(updatedUser);
        setEditing(false);
        setMessage("Profile updated with new avatar!");
        setTimeout(() => setMessage(""), 2000);
        return;
      }

      const res = await api.put("/users/me", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedUser = res.data?.user;
      setUser(updatedUser);
      setEditing(false);
      setMessage("Profile updated!");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      console.error("Update failed:", err);
      setMessage("Update failed.");
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const token = localStorage.getItem("accessToken");
      await api.delete(`/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setMessage("Post deleted!");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      console.error("Failed to delete post:", err);
      setMessage("Failed to delete post.");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return <p className="text-center pt-20">Loading profile...</p>;
  }

  return (
    <div className="pt-20 max-w-2xl mx-auto px-4 pb-20">
      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-500">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-400 flex items-center justify-center h-full w-full text-2xl">
              ?
            </span>
          )}
        </div>

        {editing ? (
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
            <div className="flex justify-center">
              <button
                onClick={() => setEditing(true)}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-1 
               hover:bg-blue-700 transition-all duration-200"
              >
                <Edit3 size={16} /> Edit Profile
              </button>
            </div>
          </div>
        )}

        {message && <p className="text-sm text-green-600 mt-3">{message}</p>}
      </div>

      {/* Posts */}
      <div className="mt-6 space-y-4">
        <h3 className="font-semibold text-lg">Your Posts</h3>
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              {...post}
              showDelete={true}             // only profile page
              onDelete={async (postId) => {
                try {
                  await api.delete(`/posts/${postId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
                  });
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
