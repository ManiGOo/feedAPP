import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Home, LogIn, LogOut, User, MessageCircle, Film } from "lucide-react";

export default function GlobalBottomNav() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  const [visible, setVisible] = useState(true);
  const [lastScroll, setLastScroll] = useState(0);

  // Detect scroll direction
  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      if (currentScroll > lastScroll && currentScroll > 60) {
        setVisible(false); // scrolling down → hide
      } else {
        setVisible(true); // scrolling up or near top → show
      }
      setLastScroll(currentScroll);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScroll]);

  const navItem = (to, Icon, label, notification = false) => (
    <Link
      to={to}
      className={`relative flex flex-col items-center justify-center flex-1 py-1 text-gray-400 hover:text-blue-400 transition-colors ${
        path === to ? "text-blue-500" : ""
      }`}
    >
      <Icon className="w-6 h-6" />
      <span className="text-[11px] mt-0.5">{label}</span>
      {notification && (
        <span className="absolute top-1 right-4 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      )}
    </Link>
  );

  return (
    <nav
      className={`fixed bottom-0 left-0 w-full z-50 transform transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex justify-around items-center max-w-md mx-auto h-14 bg-gray-900 border-t border-gray-800 rounded-t-2xl shadow-lg px-2 sm:px-4">
        {navItem("/", Home, "Home")}
        {user && navItem("/messages", MessageCircle, "Messages", true)}
        {navItem("/clips", Film, "Clips")}
        {user && navItem("/profile", User, "Profile")}
        {user ? (
          <button
            onClick={logout}
            className="flex flex-col items-center justify-center flex-1 py-1 text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-6 h-6" />
            <span className="text-[11px] mt-0.5">Logout</span>
          </button>
        ) : (
          navItem("/login", LogIn, "Login")
        )}
      </div>
    </nav>
  );
}