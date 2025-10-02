import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Home, LogIn, LogOut, User, MessageCircle, Video } from "lucide-react";
import { useEffect, useState } from "react";

export default function BottomNav() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [pulse, setPulse] = useState(false);

  // Pulse animation for Clips button
  useEffect(() => {
    if (location.pathname === "/clips") {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  return (
    <nav className="bg-gray-800 text-white fixed bottom-0 left-0 w-full z-50 border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-4 py-2 flex justify-around items-center">
        
        {/* Home */}
        <Link
          to="/"
          className="flex flex-col items-center text-gray-300 hover:text-blue-400 transition-transform transform hover:scale-110"
        >
          <Home className="w-6 h-6" />
          <span className="text-xs">Home</span>
        </Link>

        {/* Messages */}
        {user && (
          <Link
            to="/messages"
            className="relative flex flex-col items-center text-gray-300 hover:text-blue-400 transition-transform transform hover:scale-110"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs">Messages</span>
            {/* Optional: notification dot */}
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </Link>
        )}

        {/* Clips / Reels - center */}
        <Link
          to="/clips"
          className={`flex flex-col items-center -mt-6 bg-gradient-to-tr from-pink-500 to-purple-500 p-3 rounded-full shadow-lg text-white transition-transform 
                      ${pulse ? "animate-pulse scale-125" : "hover:scale-110"}`}
        >
          <Video className="w-9 h-9" />
          <span className="text-xs mt-1">Clips</span>
        </Link>

        {/* Profile */}
        {user && (
          <Link
            to="/profile"
            className="flex flex-col items-center text-gray-300 hover:text-blue-400 transition-transform transform hover:scale-110"
          >
            <User className="w-6 h-6" />
            <span className="text-xs">Profile</span>
          </Link>
        )}

        {/* Auth */}
        {user ? (
          <button
            onClick={logout}
            className="flex flex-col items-center text-gray-300 hover:text-red-500 transition-transform transform hover:scale-110"
          >
            <LogOut className="w-6 h-6" />
            <span className="text-xs">Logout</span>
          </button>
        ) : (
          <Link
            to="/login"
            className="flex flex-col items-center text-gray-300 hover:text-green-400 transition-transform transform hover:scale-110"
          >
            <LogIn className="w-6 h-6" />
            <span className="text-xs">Login</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
