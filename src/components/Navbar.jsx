import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Navbar() {
  const NAVBAR_HEIGHT = 72; // px
  const [hidden, setHidden] = useState(false);
  const [lastScroll, setLastScroll] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      if (currentScroll > lastScroll + 10) {
        setHidden(true);
      } else if (currentScroll < lastScroll - 10) {
        setHidden(false);
      }
      setLastScroll(currentScroll);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScroll]);

  return (
    <nav
      className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm fixed top-0 left-0 w-full z-50 transition-transform duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-center items-center h-[72px]">
        <Link
          to="/"
          className="text-2xl font-extrabold text-gray-900 dark:text-gray-100"
        >
          Feed
        </Link>
      </div>
    </nav>
  );
}
