// src/pages/Profile.jsx
import { useEffect, useState } from "react";
import PostCard from "../components/PostCard";
import api from "../utils/api";

function Profile() {
  const [user, setUser] = useState({
    id: null,
    username: "",
    email: "",
    bio: "",
    avatar_url: "",
  });
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    bio: "",
    avatar_url: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch profile data including user's posts
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");

      // Fetch user info
      const resUser = await api.get("/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = resUser.data?.user;

      if (!userData) {
        setMessage("Failed to load profile.");
        setLoading(false);
        return;
      }

      setUser(userData);
      setFormData({
        username: userData.username || "",
        email: userData.email || "",
        bio: userData.bio || "",
        avatar_url: userData.avatar_url || "",
      });

      // Fetch all posts
      const resPosts = await api.get("/posts", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Filter posts by this user and attach avatar_url
      const userPosts = resPosts.data
        .filter((post) => post.author_id === userData.id)
        .map((post) => ({
          ...post,
          avatar_url: userData.avatar_url,
        }));

      setPosts(userPosts);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setMessage("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      const res = await api.put("/users/me", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedUser = res.data?.user;

      if (updatedUser) {
        setUser(updatedUser);
        setMessage("Profile updated successfully!");
        setEditing(false);

        // Update avatar_url in posts too
        setPosts((prev) =>
          prev.map((p) => ({ ...p, avatar_url: updatedUser.avatar_url }))
        );

        setTimeout(() => setMessage(""), 2000);
      } else {
        setMessage("Update failed. Try again.");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setMessage("Update failed. Try again.");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="ml-0 md:ml-64 pt-20 max-w-2xl mx-auto px-4">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="ml-0 md:ml-64 pt-20 max-w-2xl mx-auto px-4">
      {/* Profile Header */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 bg-gray-300 rounded-full overflow-hidden">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt="avatar"
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-gray-400 flex items-center justify-center h-full w-full">
              ?
            </span>
          )}
        </div>
        <div className="flex-1">
          {editing ? (
            <form onSubmit={handleUpdate} className="space-y-2">
              <input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full border p-1 rounded"
                required
                placeholder="Username"
              />
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full border p-1 rounded"
                required
                placeholder="Email"
              />
              <input
                type="text"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                className="w-full border p-1 rounded"
                placeholder="Bio"
              />
              <input
                type="text"
                value={formData.avatar_url}
                onChange={(e) =>
                  setFormData({ ...formData, avatar_url: e.target.value })
                }
                className="w-full border p-1 rounded"
                placeholder="Avatar URL"
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <h2 className="text-xl font-bold">{user.username}</h2>
              <p className="text-gray-500">@{user.username}</p>
              <p className="text-gray-600">{user.bio}</p>
              <button
                onClick={() => setEditing(true)}
                className="mt-2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Edit Profile
              </button>
            </>
          )}
          {message && <p className="text-sm text-green-600 mt-2">{message}</p>}
        </div>
      </div>

      {/* User Posts */}
      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map((post) => <PostCard key={post.id} {...post} />)
        ) : (
          <p className="text-gray-500">No posts yet.</p>
        )}
      </div>
    </div>
  );
}

export default Profile;
