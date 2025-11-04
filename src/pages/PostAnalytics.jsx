// pages/PostAnalytics.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../utils/api";
import { BarChart3, Eye, Heart, MessageCircle, Repeat2, Bookmark } from "lucide-react";

export default function PostAnalytics() {
  const { id } = useParams();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get(`/posts/${id}/view`).then(setStats);
  }, [id]);

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Post Analytics</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl"><Eye className="inline mr-2" /> {stats.views} views</div>
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl"><Heart className="inline mr-2" /> {stats.likes} likes</div>
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl"><MessageCircle className="inline mr-2" /> {stats.comments} comments</div>
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl"><Repeat2 className="inline mr-2" /> {stats.reposts} reposts</div>
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl"><Bookmark className="inline mr-2" /> {stats.bookmarks} bookmarks</div>
      </div>
    </div>
  );
}