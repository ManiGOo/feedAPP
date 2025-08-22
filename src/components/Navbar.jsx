import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
    const [theme, setTheme] = useState("light");
    const { user, logout } = useAuth(); // get current logged-in user + logout

    useEffect(() => {
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            setTheme("dark");
            document.documentElement.classList.add("dark");
        }
    }, []);

    useEffect(() => {
        if (theme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [theme]);

    const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

    return (
        <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
                <Link to="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    FriendFeed
                </Link>
                <div className="flex items-center gap-6">
                    <Link to="/" className="text-gray-700 dark:text-gray-300 hover:underline">
                        Home
                    </Link>

                    {user ? (
                        <>
                            <Link
                                to={`/profile/${user.id}`}
                                className="text-gray-700 dark:text-gray-300 hover:underline"
                            >
                                Profile
                            </Link>
                            <Link
                                to="/following"
                                className="text-gray-700 dark:text-gray-300 hover:underline"
                            >
                                Following
                            </Link>
                            <button
                                onClick={logout}
                                className="text-gray-700 dark:text-gray-300 hover:underline"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="text-gray-700 dark:text-gray-300 hover:underline">
                            Login
                        </Link>
                    )}

                    <button
                        onClick={toggleTheme}
                        className="px-3 py-1 rounded-lg border dark:border-gray-700 border-gray-300 text-sm
                           text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
                    </button>
                </div>
            </div>
        </nav>
    );
}
