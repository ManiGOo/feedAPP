// src/context/ClipsContext.jsx
import React, { createContext, useContext, useState } from "react";

const ClipsContext = createContext();

export function ClipsProvider({ children }) {
  const [clips, setClips] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const updateClip = (clipId, updates) => {
    setClips((prev) =>
      prev.map((clip) =>
        clip.id === clipId ? { ...clip, ...updates } : clip
      )
    );
  };

  return (
    <ClipsContext.Provider value={{ clips, setClips, currentIndex, setCurrentIndex, updateClip }}>
      {children}
    </ClipsContext.Provider>
  );
}

export function useClips() {
  const context = useContext(ClipsContext);
  if (!context) {
    throw new Error("useClips must be used within a ClipsProvider");
  }
  return context;
}