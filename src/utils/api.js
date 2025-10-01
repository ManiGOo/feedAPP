// api.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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

// ---------------- DM METHODS ----------------
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

// ---------------- GROUP METHODS ----------------
api.getGroups = async () => {
  const res = await api.get("/messages/groups");
  return res.data;
};

api.getGroupMessages = async (groupId) => {
  const res = await api.get(`/messages/group/${groupId}`);
  return res.data;
};

// ---------------- USER METHODS ----------------
api.getUserProfile = async (userId) => {
  const res = await api.get(`/users/profile/${userId}`);
  return res.data;
};

api.getFollowableUsers = async () => {
  const res = await api.get("/users/following");
  return res.data;
};

// -------------------- MESSAGE METHODS ----------------
api.updateMessage = async (messageId, content) => {
  const res = await api.put(`/messages/message/${messageId}`, { content });
  return res.data;
};

api.deleteMessage = async (messageId) => {
  const res = await api.delete(`/messages/message/${messageId}`);
  return res.data;
};

export default api;