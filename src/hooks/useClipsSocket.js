// src/hooks/useClipsSocket.js
import { useEffect, useCallback } from "react";
import api, { socket } from "../utils/api";

export default function useClipsSocket({
  clips,
  setClips,
  currentIndex,
  updateClipCounts,
  handleCommentAdded,
  handleNewClip,
}) {
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
    ({ clipId, like_count }) => {
      updateClipCounts?.(
        clipId,
        like_count,
        clips.find((c) => c.id === clipId)?.comments_count || 0
      );
    },
    [clips, updateClipCounts]
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
