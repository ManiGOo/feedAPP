// src/utils/api.js
import axios from "axios";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// -------------------- AXIOS INSTANCE --------------------
const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// -------------------- REQUEST INTERCEPTOR --------------------
api.interceptors.request.use((config) => {
  const access = localStorage.getItem("accessToken");
  if (access) config.headers.Authorization = `Bearer ${access}`;
  return config;
});

// -------------------- RESPONSE INTERCEPTOR --------------------
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const res = await api.post("/auth/refresh", { refreshToken });
        localStorage.setItem("accessToken", res.data.accessToken);

        original.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return api(original);
      } catch (err) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);


// -------------------- SOCKET.IO --------------------
const token = localStorage.getItem("accessToken");
export const socket = io(API_URL.replace("/api", ""), {
  auth: { token },
});

// -------------------- POSTS --------------------
api.getPosts = async () => (await api.get("/posts")).data;
api.getPostById = async (postId) => (await api.get(`/posts/${postId}`)).data;
api.createPost = async (data) => {
  const formData = new FormData();
  if (data.content) formData.append("content", data.content);
  if (data.image) formData.append("image", data.image);
  if (data.video) formData.append("video", data.video);
  return (await api.post("/posts", formData, { headers: { "Content-Type": "multipart/form-data" } })).data;
};
api.deletePost = async (postId) => (await api.delete(`/posts/${postId}`)).data;
api.toggleLikePost = async (postId) => (await api.post(`/posts/${postId}/like`)).data;

// -------------------- CLIPS --------------------
api.getClips = async () => (await api.get("/clips")).data;
api.getClipById = async (clipId) => (await api.get(`/clips/${clipId}`)).data;
api.uploadClip = async (formData, onUploadProgress) => {
  if (!formData.get("video")) throw new Error("Video file required");
  return (await api.post("/clips", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  })).data;
};
api.deleteClip = async (clipId) => (await api.delete(`/clips/${clipId}`)).data;

// Likes
api.likeClip = async (clipId) => (await api.post(`/clips/${clipId}/like`)).data;
api.unlikeClip = async (clipId) => (await api.post(`/clips/${clipId}/unlike`)).data;

// Comments
api.getClipComments = async (clipId) => (await api.get(`/clips/${clipId}/comments`)).data;
api.commentClip = async (clipId, content) =>
  (await api.post(`/clips/${clipId}/comment`, { content })).data;

// -------------------- USERS --------------------

// Get current logged-in user
api.getCurrentUser = async () => (await api.get("/users/me")).data;

// Get any user profile by ID
api.getUserProfile = async (userId) => (await api.get(`/users/profile/${userId}`)).data;

// Search users (debounced search in frontend)
api.searchUsers = async (query) => {
  if (!query?.trim()) return [];

  // Use the profile endpoint with query param
  return (await api.get(`/users/profile/me?q=${encodeURIComponent(query)}`)).data;
};
// Add under // -------------------- USERS -------------------- or a new // -------------------- FOLLOW --------------------
api.getUserFollowing = async (userId) => {
  if (!userId) throw new Error("User ID required");
  return (await api.get(`/follow/following/${userId}`)).data;
};
// 🔹 Search among users you follow by username
api.searchFollowingByUsername = async (query) => {
  if (!query || !query.trim()) return [];

  try {
    const res = await api.get(`/follow/following/search?q=${encodeURIComponent(query.trim())}`);
    return res.data || [];
  } catch (err) {
    if (err.response?.status === 400 || err.response?.status === 404) {
      console.warn("Bad search request:", err.response.data);
      return [];
    }
    console.error("Error searching following users:", err);
    throw err;  // Let MessagesPage catch for state
  }
};
// Update logged-in user's profile (supports file uploads)
api.updateProfile = async (data) => {
  const formData = new FormData();

  if (data.username) formData.append("username", data.username);
  if (data.email) formData.append("email", data.email);
  if (data.bio !== undefined) formData.append("bio", data.bio);

  if (data.avatar) {
    // New file upload
    formData.append("avatar", data.avatar);
  } else if (data.removeAvatar) {
    // Explicit request to remove avatar
    formData.append("removeAvatar", "true");
  }

  if (data.password) formData.append("password", data.password);

  return (await api.put("/users/me", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })).data;
};
// Search users


// -------------------- DMs --------------------
api.getDMs = async () => (await api.get("/messages/dms")).data;
api.createDM = async (recipientId) => (await api.post("/messages/dm/start", { recipient_id: recipientId })).data;
api.getDMConversation = async (otherUserId) => (await api.get(`/messages/dm/${otherUserId}`)).data;
api.getOrCreateDMConversation = async (otherUserId) => {
  await api.createDM(otherUserId);
  return api.getDMConversation(otherUserId);
};

// -------------------- GROUPS --------------------
api.getGroups = async () => (await api.get("/messages/groups")).data;
api.getGroupMessages = async (groupId) => (await api.get(`/messages/group/${groupId}`)).data;

// -------------------- MESSAGES --------------------
api.updateMessage = async (messageId, content) => (await api.put(`/messages/message/${messageId}`, { content })).data;
api.deleteMessage = async (messageId) => (await api.delete(`/messages/message/${messageId}`)).data;

// -------------------- SOCKET EVENTS --------------------
// Clips
export const onNewClip = (callback) => socket.on("newClip", callback);
export const onClipLiked = (callback) => socket.on("clipLiked", callback);
export const onNewClipComment = (callback) => socket.on("newClipComment", callback);
export const onClipDeleted = (callback) => socket.on("clipDeleted", callback);

// Messages
export const onDMMessage = (callback) => socket.on("dmMessage", callback);
export const onGroupMessage = (callback) => socket.on("groupMessage", callback);
export const onMessageDeleted = (callback) => socket.on("messageDeleted", callback);

export default api;
