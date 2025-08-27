import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Home, LogIn, LogOut, User } from "lucide-react";

export default function BottomNav() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 fixed bottom-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 py-2 flex justify-around items-center">
        {/* Home */}
        <Link
          to="/"
          className="flex flex-col items-center text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
        >
          <Home className="w-6 h-6" />
          <span className="text-xs">Home</span>
        </Link>

        {/* Profile */}
        {user && (
          <Link
            to="/profile"
            className="flex flex-col items-center text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
          >
            <User className="w-6 h-6" />
            <span className="text-xs">Profile</span>
          </Link>
        )}

        {/* Auth */}
        {user ? (
          <button
            onClick={logout}
            className="flex flex-col items-center text-gray-700 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400"
          >
            <LogOut className="w-6 h-6" />
            <span className="text-xs">Logout</span>
          </button>
        ) : (
          <Link
            to="/login"
            className="flex flex-col items-center text-gray-700 dark:text-gray-300 hover:text-green-500 dark:hover:text-green-400"
          >
            <LogIn className="w-6 h-6" />
            <span className="text-xs">Login</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
