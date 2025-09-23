import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader.jsx";

export default function Follow() {
  const { userId, type } = useParams(); // type = "followers" | "following"
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const endpoint = type === "followers"
        ? `/follow/followers/${userId}`
        : `/follow/following/${userId}`;

      const res = await api.get(endpoint);
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [userId, type]);

  const toggleFollow = async (id, index) => {
    try {
      // Optimistic UI
      setUsers(prev => {
        const copy = [...prev];
        copy[index].followed_by_me = !copy[index].followed_by_me;
        return copy;
      });

      const res = await api.post(`/follow/toggle/${id}`);
      setUsers(prev => {
        const copy = [...prev];
        copy[index].followed_by_me = res.data.isFollowing;
        return copy;
      });
    } catch (err) {
      console.error("Toggle follow failed:", err);
      // Revert UI
      setUsers(prev => {
        const copy = [...prev];
        copy[index].followed_by_me = !copy[index].followed_by_me;
        return copy;
      });
    }
  };

  if (loading) return <Loader size={50} color="#3b82f6" />;

  return (
    <div className="max-w-2xl mx-auto pt-20 px-4">
      <h2 className="text-xl font-bold mb-4">
        {type === "followers" ? "Followers" : "Following"}
      </h2>

      {users.length === 0 ? (
        <p className="text-gray-500 text-center py-6">
          {type === "followers"
            ? "No one is following this user yet."
            : "This user is not following anyone yet."}
        </p>
      ) : (
        <div className="space-y-4">
          {users.map((u, i) => (
            <div key={u.id} className="flex items-center justify-between bg-white dark:bg-gray-900 p-4 rounded-xl shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 font-bold">{u.username[0]}</span>
                  )}
                </div>
                <span className="font-semibold">{u.username}</span>
              </div>
              {currentUser.id !== u.id && (
                <button
                  onClick={() => toggleFollow(u.id, i)}
                  className={`px-4 py-1 rounded-lg font-medium ${
                    u.followed_by_me
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  {u.followed_by_me ? "Following" : "Follow"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
