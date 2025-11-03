// components/Navbar.jsx
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Navbar() {
  const NAVBAR_HEIGHT = 72;
  const [hidden, setHidden] = useState(false);
  const [lastScroll, setLastScroll] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      if (current > lastScroll + 10 && current > NAVBAR_HEIGHT) {
        setHidden(true);
      } else if (current < lastScroll - 10) {
        setHidden(false);
      }
      setLastScroll(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScroll]);

  return (
    <nav
      className={`
        fixed top-0 left-0 w-full z-50 bg-white dark:bg-gray-900
        border-b border-gray-200 dark:border-gray-800 shadow-sm
        transition-transform duration-300
        ${hidden ? "-translate-y-full" : "translate-y-0"}
      `}
      style={{ height: NAVBAR_HEIGHT }}
    >
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-center">
        <Link to="/" className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
          Feed
        </Link>
      </div>
    </nav>
  );
}