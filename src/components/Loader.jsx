function Loader({
  loading = true,
  color = "#000000",
  size = 40,
  speedMultiplier = 1,
  className = "",
}) {
  if (!loading) return null;

  const dotStyle = {
    width: typeof size === "number" ? `${size / 5}px` : size,
    height: typeof size === "number" ? `${size / 5}px` : size,
    margin: "0 4px",
    borderRadius: "50%",
    backgroundColor: color,
    display: "inline-block",
    animation: `loader-bounce ${0.6 / speedMultiplier}s infinite alternate`,
  };

  return (
    <div className={`flex justify-center items-center p-4 ${className}`}>
      <span style={{ ...dotStyle, animationDelay: "0s" }} />
      <span style={{ ...dotStyle, animationDelay: "0.2s" }} />
      <span style={{ ...dotStyle, animationDelay: "0.4s" }} />
    </div>
  );
}

export default Loader;

// Inject keyframes once when running in browser
if (typeof document !== "undefined") {
  const styleId = "loader-keyframes";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
      @keyframes loader-bounce {
        from { transform: translateY(0); opacity: 0.6; }
        to { transform: translateY(-8px); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
}
