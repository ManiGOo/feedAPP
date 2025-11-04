// utils/api.js
import axios from "axios";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL?.trim() || "http://localhost:5000/api";
const WS_URL = API_URL.replace("/api", "").replace(/\/+$/, ""); // clean trailing slash

// === AXIOS INSTANCE ===
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// === SOCKET.IO (with reconnect & auth) ===
let socket = null;
const createSocket = () => {
  const token = localStorage.getItem("accessToken");
  if (socket) socket.disconnect();

  socket = io(WS_URL, {
    auth: token ? { token } : {},
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    autoConnect: true,
  });

  socket.on("connect", () => console.log("Socket connected:", socket.id));
  socket.on("connect_error", (err) => console.warn("Socket error:", err.message));
  socket.on("disconnect", () => console.log("Socket disconnected"));
};

createSocket();

// Re-auth on token refresh
const refreshAuth = () => {
  const token = localStorage.getItem("accessToken");
  if (socket?.connected && token) {
    socket.auth.token = token;
    socket.emit("auth", { token });
  }
};

// === INTERCEPTORS ===
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Avoid infinite loop
    if (original._retry) return Promise.reject(error);
    if (error.response?.status !== 401) return Promise.reject(error);

    original._retry = true;

    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) throw new Error("No refresh token");

      const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      localStorage.setItem("accessToken", data.accessToken);

      // Update socket auth
      refreshAuth();

      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    } catch (err) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// === POSTS ===
api.getPosts = (feed = null) => {
  const url = feed ? `/posts?feed=${feed}` : "/posts";
  return api.get(url).then(r => Array.isArray(r.data) ? r.data : []);
};
api.getPostById = (id) => api.get(`/posts/${id}`).then(r => r.data);
// CREATE POST
api.createPost = (data) => {
  const fd = new FormData();
  if (data.content?.trim()) fd.append("content", data.content.trim());
  if (data.image) fd.append("image", data.image);
  if (data.video) fd.append("video", data.video);

  return api.post("/posts", fd, {
    headers: { "Content-Type": undefined },
  }).then(r => r.data);
};

// UPDATE POST
api.updatePost = (id, data) => {
  const fd = new FormData();
  if (data.content?.trim()) fd.append("content", data.content.trim());
  if (data.image) fd.append("image", data.image);
  if (data.video) fd.append("video", data.video);
  if (data.removeMedia) fd.append("removeMedia", "true");

  return api.put(`/posts/${id}`, fd, {
    headers: { "Content-Type": undefined },
  }).then(r => r.data);
};
api.deletePost = (id) => api.delete(`/posts/${id}`).then(r => r.data);
api.toggleLike = (id) => api.post(`/posts/${id}/like`).then(r => r.data);
api.repost = (id) => api.post(`/posts/${id}/repost`).then(r => r.data);
api.undoRepost = (id) => api.delete(`/posts/${id}/repost`).then(r => r.data);

// utils/api.js
api.bookmark = (id) => api.post(`/posts/${id}/bookmark`).then(r => r.data);
api.unbookmark = (id) => api.delete(`/posts/${id}/bookmark`).then(r => r.data);
api.quote = (id, content, image, video) => {
  const fd = new FormData();
  fd.append("content", content);
  if (image) fd.append("image", image);
  if (video) fd.append("video", video);
  fd.append("quote_from", id);
  return api.post("/posts", fd).then(r => r.data);
};

// === CLIPS ===
api.getClips = () => api.get("/clips").then(r => r.data);

api.getClipById = (clipId) => {
  return api.get(`/clips/${clipId}`).then((response) => response.data);
};

api.uploadClip = (fd, onProgress) => {
  if (!fd.get("video")) throw new Error("Video required");
  return api.post("/clips", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: onProgress,
  }).then(r => r.data);
};
api.deleteClip = (id) => api.delete(`/clips/${id}`).then(r => r.data);
api.likeClip = (id) => api.post(`/clips/${id}/like`).then(r => r.data);
api.unlikeClip = (id) => api.post(`/clips/${id}/unlike`).then(r => r.data);
api.getClipComments = (id) => api.get(`/clips/${id}/comments`).then(r => r.data);
api.commentClip = (id, content) => api.post(`/clips/${id}/comment`, { content }).then(r => r.data);


// === USERS ===
api.getCurrentUser = () => api.get("/users/me").then(r => r.data);
api.getUserProfile = (id) => api.get(`/users/profile/${id}`).then(r => r.data);
api.searchUsers = (q) => q?.trim() ? api.get(`/users/search?q=${encodeURIComponent(q.trim())}`).then(r => r.data) : Promise.resolve([]);
api.getUserFollowing = (id) => api.get(`/follow/following/${id}`).then(r => r.data);
api.searchFollowingByUsername = (q) => {
  if (!q?.trim()) return Promise.resolve([]);
  return api.get(`/follow/following/search?q=${encodeURIComponent(q.trim())}`).then(r => r.data).catch(err => {
    if (err.response?.status >= 400 && err.response?.status < 500) return [];
    throw err;
  });
};

// === MESSAGES ===
api.getDMs = () => api.get("/messages/dms").then(r => r.data);
api.createDM = (id) => api.post("/messages/dm/start", { recipient_id: id }).then(r => r.data);
api.getDMConversation = (id) => api.get(`/messages/dm/${id}`).then(r => r.data);
api.getOrCreateDMConversation = async (id) => {
  try { await api.createDM(id); } catch (e) { /* ignore if exists */ }
  return api.getDMConversation(id);
};

api.getGroups = () => api.get("/messages/groups").then(r => r.data);
api.getGroupMessages = (id) => api.get(`/messages/group/${id}`).then(r => r.data);
api.createGroup = ({ name, memberIds, avatar }) => {
  if (!name?.trim() || !Array.isArray(memberIds) || memberIds.length === 0)
    throw new Error("Name and members required");
  const fd = new FormData();
  fd.append("name", name.trim());
  fd.append("memberIds", JSON.stringify(memberIds));
  if (avatar) fd.append("avatar", avatar);
  return api.post("/messages/group/create", fd).then(r => r.data);
};

api.updateMessage = (id, content) => api.put(`/messages/message/${id}`, { content }).then(r => r.data);
api.deleteMessage = (id) => api.delete(`/messages/message/${id}`).then(r => r.data);

// === SOCKET LISTENERS ===
export const onNewClip = (cb) => socket.on("newClip", cb);
export const onClipLiked = (cb) => socket.on("clipLiked", cb);
export const onNewClipComment = (cb) => socket.on("newClipComment", cb);
export const onClipDeleted = (cb) => socket.on("clipDeleted", cb);

export const onDMMessage = (cb) => socket.on("dmMessage", cb);
export const onGroupMessage = (cb) => socket.on("groupMessage", cb);
export const onMessageDeleted = (cb) => socket.on("messageDeleted", cb);
export const onErrorMessage = (cb) => socket.on("errorMessage", cb);

// === EXPORT ===
export { socket };
export default api;