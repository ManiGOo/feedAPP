import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// -------------------- INTERCEPTORS --------------------
api.interceptors.request.use((config) => {
  const access = localStorage.getItem("accessToken");
  if (access) config.headers.Authorization = `Bearer ${access}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem("accessToken", res.data.accessToken);

        original.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return api(original);
      } catch (err) {
        console.error("Token refresh failed:", err);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

// -------------------- POSTS --------------------
api.getPosts = async () => {
  const res = await api.get("/posts");
  return res.data;
};

api.getPostById = async (postId) => {
  const res = await api.get(`/posts/${postId}`);
  return res.data;
};

api.createPost = async (data) => {
  const formData = new FormData();
  if (data.content) formData.append("content", data.content);
  if (data.image) formData.append("image", data.image);
  if (data.video) formData.append("video", data.video);

  const res = await api.post("/posts", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

api.deletePost = async (postId) => {
  const res = await api.delete(`/posts/${postId}`);
  return res.data;
};

api.toggleLikePost = async (postId) => {
  const res = await api.post(`/posts/${postId}/like`);
  return res.data;
};

// -------------------- CLIPS --------------------
api.getClips = async () => {
  const res = await api.get("/clips");
  return res.data;
};

api.getClipById = async (clipId) => {
  const res = await api.get(`/clips/${clipId}`);
  return res.data;
};

// -------------------- UPLOAD CLIP (with progress) --------------------
api.uploadClip = async (formData, onUploadProgress) => {
  if (!formData || !formData.get("video")) throw new Error("Video file is required");

  const res = await api.post("/clips", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress, // progress callback
  });

  return res.data;
};

api.deleteClip = async (clipId) => {
  const res = await api.delete(`/clips/${clipId}`);
  return res.data;
};

api.toggleLikeClip = async (clipId) => {
  const res = await api.post(`/clips/${clipId}/like`);
  return res.data;
};

// -------------------- CLIP COMMENTS --------------------
api.getClipComments = async (clipId) => {
  const res = await api.get(`/clips/${clipId}/comments`);
  return res.data;
};

api.commentClip = async (clipId, content) => {
  const res = await api.post(`/clips/${clipId}/comments`, { content });
  return res.data;
};

// -------------------- USERS --------------------
api.getUserProfile = async (userId) => {
  const res = await api.get(`/users/profile/${userId}`);
  return res.data;
};

api.getFollowableUsers = async () => {
  const res = await api.get("/users/following");
  return res.data;
};

// -------------------- DMs --------------------
api.getDMs = async () => {
  const res = await api.get("/messages/dms");
  return res.data;
};

api.createDM = async (recipientId) => {
  const res = await api.post("/messages/dm/start", { recipient_id: recipientId });
  return res.data;
};

api.getDMConversation = async (otherUserId) => {
  const res = await api.get(`/messages/dm/${otherUserId}`);
  return res.data;
};

api.getOrCreateDMConversation = async (otherUserId) => {
  await api.createDM(otherUserId);
  return api.getDMConversation(otherUserId);
};

// -------------------- GROUPS --------------------
api.getGroups = async () => {
  const res = await api.get("/messages/groups");
  return res.data;
};

api.getGroupMessages = async (groupId) => {
  const res = await api.get(`/messages/group/${groupId}`);
  return res.data;
};

// -------------------- MESSAGES --------------------
api.updateMessage = async (messageId, content) => {
  const res = await api.put(`/messages/message/${messageId}`, { content });
  return res.data;
};

api.deleteMessage = async (messageId) => {
  const res = await api.delete(`/messages/message/${messageId}`);
  return res.data;
};

export default api;
