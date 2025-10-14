// src/hooks/useClipsSocket.js
import { useEffect, useCallback } from "react";
import api, { socket } from "../utils/api";
import { useAuth } from "../context/AuthContext.jsx";

export default function useClipsSocket({
  clips,
  setClips,
  currentIndex,
  updateClip,
  handleCommentAdded,
  handleNewClip,
}) {
  const { user } = useAuth();

  // -------------------- New Clip --------------------
  const onNewClip = useCallback(
    async (newClip) => {
      if (!newClip) return;
      try {
        const profile = await api.getUserProfile(newClip.user_id || newClip.userId);
        const enrichedClip = {
          ...newClip,
          author: profile.username,
          avatar_url: profile.avatar_url,
          like_count: 0,
          comments_count: 0,
          liked_by_me: false,
          is_followed_author: false,
        };
        setClips((prev) => [enrichedClip, ...prev]);
        handleNewClip?.(enrichedClip);
      } catch (err) {
        console.error("Failed to enrich new clip:", err);
        setClips((prev) => [newClip, ...prev]);
      }
    },
    [setClips, handleNewClip]
  );

  // -------------------- Clip Liked --------------------
  const onClipLiked = useCallback(
    ({ clipId, userId, like_count, liked }) => {
      const updates = { like_count };
      if (userId === user?.id) {
        updates.liked_by_me = liked;
      }
      updateClip?.(clipId, updates);
    },
    [updateClip, user]
  );

  // -------------------- New Clip Comment --------------------
  const onNewClipComment = useCallback(
    ({ clipId }) => {
      if (clips[currentIndex]?.id === clipId) {
        handleCommentAdded?.();
      }
    },
    [clips, currentIndex, handleCommentAdded]
  );

  useEffect(() => {
    if (!socket) return;

    socket.on("newClip", onNewClip);
    socket.on("clipLiked", onClipLiked);
    socket.on("newClipComment", onNewClipComment);

    return () => {
      socket.off("newClip", onNewClip);
      socket.off("clipLiked", onClipLiked);
      socket.off("newClipComment", onNewClipComment);
    };
  }, [onNewClip, onClipLiked, onNewClipComment]);
}