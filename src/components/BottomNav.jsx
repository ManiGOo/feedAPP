import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Home, LogIn, LogOut, User, MessageCircle, Film } from "lucide-react";

export default function BottomNav() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  const navItem = (to, Icon, label, notification = false) => (
    <Link
      to={to}
      className={`flex flex-col items-center text-gray-400 hover:text-white transition-transform transform hover:scale-110 relative ${
        path === to ? "text-white" : ""
      }`}
      style={{ flex: "1 0 auto" }}
    >
      <Icon className="w-6 h-6" />
      <span className="text-xs mt-1">{label}</span>
      {notification && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
    </Link>
  );

  return (
    <nav
      className="fixed bottom-0 left-0 w-full z-50 bg-gray-900 border-t border-gray-800"
      style={{ height: "60px" }}
    >
      <div
        className="flex justify-between items-center"
        style={{ width: "448px", height: "100%", margin: "0 auto", padding: "0 16px" }}
      >
        {navItem("/", Home, "Home")}
        {user && navItem("/messages", MessageCircle, "Messages", true)}
        {navItem("/clips", Film, "Clips")}
        {user && navItem("/profile", User, "Profile")}
        {user ? (
          <button
            onClick={logout}
            className="flex flex-col items-center text-gray-400 hover:text-red-500 transition-transform transform hover:scale-110"
            style={{ flex: "1 0 auto" }}
          >
            <LogOut className="w-6 h-6" />
            <span className="text-xs mt-1">Logout</span>
          </button>
        ) : (
          navItem("/login", LogIn, "Login")
        )}
      </div>
    </nav>
  );
}